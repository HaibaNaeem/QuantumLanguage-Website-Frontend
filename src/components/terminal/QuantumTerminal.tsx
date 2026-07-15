import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { cn } from '../../lib/utils';

interface QuantumTerminalProps {
  files: Record<string, string>;
  activeFile?: string;
  onRun?: (file: string) => void;
  theme?: "dark" | "light";
}

const HISTORY_KEY = 'quantum-terminal-history';
const HISTORY_MAX = 100;

const SHORTCUTS_HELP = [
  'Available shortcuts:',
  '  Enter            run the typed command',
  '  Up / Down        browse command history',
  '  Left / Right     move cursor within the line',
  '  Ctrl+Left/Right  jump by word',
  '  Home / End       jump to start / end of the line (also Ctrl+A / Ctrl+E)',
  '  Delete           remove the character after the cursor',
  '  Ctrl+Backspace   delete the word before the cursor',
  '  Ctrl+Z           undo the last edit to the current line',
  '  Tab              autocomplete open filenames',
  '  Ctrl+C           copy selection, or interrupt if nothing selected',
  '  Ctrl+L           clear the terminal',
  '  clear            same as Ctrl+L',
  '  history          list previously run commands',
  '  help             show this list',
];

const findPrevWordBoundary = (text: string, pos: number) => {
  let i = pos;
  while (i > 0 && text[i - 1] === ' ') i--;
  while (i > 0 && text[i - 1] !== ' ') i--;
  return i;
};

const findNextWordBoundary = (text: string, pos: number) => {
  let i = pos;
  const len = text.length;
  while (i < len && text[i] === ' ') i++;
  while (i < len && text[i] !== ' ') i++;
  return i;
};

export default function QuantumTerminal({ files, activeFile, onRun, theme = "dark" }: QuantumTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lineBufferRef = useRef<string>('');
  const cursorPosRef = useRef<number>(0);
  const lastCursorRowRef = useRef<number>(0); // which wrapped visual row the terminal's real cursor is on, within the current input block
  const undoStackRef = useRef<{ text: string; cursor: number }[]>([]);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(0);
  const activeFileRef = useRef<string | undefined>(activeFile);
  const onRunRef = useRef(onRun);
  const filesRef = useRef(files);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // keep these refs current without remounting the terminal (the mount
  // effect below only depends on [theme], so a plain closure over the
  // props would go stale the moment a parent re-render passes a new value)
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    if (!containerRef.current) return;
    setIsLoading(true);

    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      historyRef.current = saved ? JSON.parse(saved) : [];
    } catch {
      historyRef.current = [];
    }
    historyIndexRef.current = historyRef.current.length;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      scrollback: 5000,
      theme: theme === "dark"
        ? {
            background: '#0D1117',
            foreground: '#E6EDF3',
            cursor: '#58A6FF',
            selectionBackground: '#58A6FF66',
            selectionForeground: '#FFFFFF',
            selectionInactiveBackground: '#58A6FF33',
          }
        : {
            background: '#FFFFFF',
            foreground: '#0D1117',
            cursor: '#1F6FEB',
            selectionBackground: '#1F6FEB4D',
            selectionForeground: '#FFFFFF',
            selectionInactiveBackground: '#1F6FEB26',
          },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    const getPrompt = () => (activeFileRef.current ? `[${activeFileRef.current}] $ ` : '$ ');

    term.writeln('\x1b[36mQuantum Terminal\x1b[0m  v2.0.4');
    term.writeln('Type `quantum <file>.sa` or `qrun <file>.sa` to run a program. Type `help` for shortcuts.');
    term.writeln('');
    term.write(getPrompt());

    // brief minimum loading state so the init animation is perceivable
    const loadingTimer = setTimeout(() => setIsLoading(false), 300);

    // Cursor moves (CUU/CUD/CUB/CUF) clamp at the edge of the current visual
    // row and never cross into a wrapped row above/below, so once a command
    // wraps to multiple rows we have to do the row/column math ourselves
    // instead of relying on relative "move left/right" escapes.
    const getCols = () => term.cols || 80;

    // move the terminal's real cursor to match cursorPosRef, from wherever
    // it currently sits (lastCursorRowRef) — text on screen is unchanged
    const repositionCursor = () => {
      const cols = getCols();
      const targetAbsCol = getPrompt().length + cursorPosRef.current;
      const targetRow = Math.floor(targetAbsCol / cols);
      const targetCol = targetAbsCol % cols;
      const rowDelta = targetRow - lastCursorRowRef.current;
      if (rowDelta > 0) term.write(`\x1b[${rowDelta}B`);
      else if (rowDelta < 0) term.write(`\x1b[${-rowDelta}A`);
      term.write(`\x1b[${targetCol + 1}G`); // CHA — absolute column, 1-indexed
      lastCursorRowRef.current = targetRow;
    };

    // move the cursor to just past the last character of the input block —
    // used before printing anything new below the current command
    const moveToBlockEnd = () => {
      const cols = getCols();
      const fullLen = getPrompt().length + lineBufferRef.current.length;
      const lastRow = Math.max(1, Math.ceil(fullLen / cols)) - 1;
      const rowDelta = lastRow - lastCursorRowRef.current;
      if (rowDelta > 0) term.write(`\x1b[${rowDelta}B`);
      lastCursorRowRef.current = lastRow;
    };

    // redraw the whole input line from scratch and reposition the cursor —
    // simplest way to keep the display correct across wrapped rows
    const redrawLine = () => {
      const cols = getCols();
      const prompt = getPrompt();
      const fullText = prompt + lineBufferRef.current;

      if (lastCursorRowRef.current > 0) term.write(`\x1b[${lastCursorRowRef.current}A`);
      term.write('\r\x1b[0J'); // back to the block's first row, then clear to end of screen
      term.write(fullText);

      lastCursorRowRef.current = Math.max(1, Math.ceil(fullText.length / cols)) - 1;
      repositionCursor();
    };

    const pushUndo = () => {
      undoStackRef.current.push({ text: lineBufferRef.current, cursor: cursorPosRef.current });
      if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    };

    const setLine = (text: string) => {
      pushUndo();
      lineBufferRef.current = text;
      cursorPosRef.current = text.length;
      redrawLine();
    };

    const insertAtCursor = (text: string) => {
      pushUndo();
      const wasAtEnd = cursorPosRef.current === lineBufferRef.current.length;
      const before = lineBufferRef.current.slice(0, cursorPosRef.current);
      const after = lineBufferRef.current.slice(cursorPosRef.current);
      lineBufferRef.current = before + text + after;
      cursorPosRef.current += text.length;
      // fast path: appending within a single row is just a plain write,
      // no need to clear+repaint the whole line (avoids visible flicker)
      const fitsOneRow = wasAtEnd && (getPrompt().length + lineBufferRef.current.length) < getCols();
      if (fitsOneRow) {
        term.write(text);
        lastCursorRowRef.current = 0;
      } else {
        redrawLine();
      }
    };

    const submitCommand = () => {
      const command = lineBufferRef.current.trim();
      moveToBlockEnd();
      term.write('\r\n');
      lastCursorRowRef.current = 0;
      if (command === 'clear') {
        term.clear();
      } else if (command === 'help') {
        SHORTCUTS_HELP.forEach((line) => term.writeln(line));
      } else if (command === 'history') {
        if (historyRef.current.length === 0) {
          term.writeln('(no history yet)');
        } else {
          historyRef.current.forEach((cmd, i) => term.writeln(`  ${i + 1}  ${cmd}`));
        }
      } else if (command.length > 0) {
        term.writeln(`(no backend wired yet) → ${command}`);
        const parts = command.split(/\s+/);
        if ((parts[0] === 'quantum' || parts[0] === 'qrun') && parts[1]) {
          onRunRef.current?.(parts[1]);
        }
      }
      if (command.length > 0) {
        const last = historyRef.current[historyRef.current.length - 1];
        if (command !== last) {
          historyRef.current.push(command);
          if (historyRef.current.length > HISTORY_MAX) {
            historyRef.current = historyRef.current.slice(-HISTORY_MAX);
          }
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRef.current));
          } catch {
            // localStorage unavailable — history just won't persist
          }
        }
      }
      historyIndexRef.current = historyRef.current.length;
      lineBufferRef.current = '';
      cursorPosRef.current = 0;
      undoStackRef.current = [];
      term.write(getPrompt());
    };

    // let the browser handle native copy when the user has text selected,
    // instead of treating Ctrl+C as "interrupt"
    term.attachCustomKeyEventHandler((event) => {
      if (event.type !== 'keydown') return true;
      const isCopyShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
      const isPasteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
      const isWordDeleteShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Backspace';
      if (isCopyShortcut && term.hasSelection()) {
        return false;
      }
      if (isPasteShortcut) {
        // xterm otherwise treats Ctrl+V as a control character and blocks
        // the browser's native paste — bail out so the browser handles it.
        return false;
      }
      if (isWordDeleteShortcut) {
        // Ctrl+Backspace isn't distinguishable from plain Backspace once it
        // reaches onData, so handle it here where the raw event is available.
        // (Ctrl+W would be the usual terminal binding for this, but browsers
        // reserve Ctrl+W to close the tab and never deliver it to the page.)
        pushUndo();
        const newPos = findPrevWordBoundary(lineBufferRef.current, cursorPosRef.current);
        lineBufferRef.current = lineBufferRef.current.slice(0, newPos) + lineBufferRef.current.slice(cursorPosRef.current);
        cursorPosRef.current = newPos;
        redrawLine();
        return false;
      }
      return true;
    });

    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (data === '\r') {
        submitCommand();
      } else if (data === '\x1b[A') {
        // Arrow Up — older command
        if (historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
          setLine(historyRef.current[historyIndexRef.current]);
        }
      } else if (data === '\x1b[B') {
        // Arrow Down — newer command
        if (historyIndexRef.current < historyRef.current.length) {
          historyIndexRef.current += 1;
          const text = historyIndexRef.current === historyRef.current.length
            ? ''
            : historyRef.current[historyIndexRef.current];
          setLine(text);
        }
      } else if (data === '\x1b[1;5D') {
        // Ctrl+Left — jump back one word
        cursorPosRef.current = findPrevWordBoundary(lineBufferRef.current, cursorPosRef.current);
        repositionCursor();
      } else if (data === '\x1b[1;5C') {
        // Ctrl+Right — jump forward one word
        cursorPosRef.current = findNextWordBoundary(lineBufferRef.current, cursorPosRef.current);
        repositionCursor();
      } else if (data === '\x1b[D') {
        // Arrow Left — move cursor back one character
        if (cursorPosRef.current > 0) {
          cursorPosRef.current -= 1;
          repositionCursor();
        }
      } else if (data === '\x1b[C') {
        // Arrow Right — move cursor forward one character
        if (cursorPosRef.current < lineBufferRef.current.length) {
          cursorPosRef.current += 1;
          repositionCursor();
        }
      } else if (data === '\x1b[H' || data === '\x1b[1~') {
        // Home — jump to start of line
        cursorPosRef.current = 0;
        repositionCursor();
      } else if (data === '\x1b[F' || data === '\x1b[4~') {
        // End — jump to end of line
        cursorPosRef.current = lineBufferRef.current.length;
        repositionCursor();
      } else if (code === 1) {
        // Ctrl+A — jump to start of line (Unix-style alias for Home)
        cursorPosRef.current = 0;
        repositionCursor();
      } else if (code === 5) {
        // Ctrl+E — jump to end of line (Unix-style alias for End)
        cursorPosRef.current = lineBufferRef.current.length;
        repositionCursor();
      } else if (code === 26) {
        // Ctrl+Z — undo the last edit to the current line
        const prev = undoStackRef.current.pop();
        if (prev) {
          lineBufferRef.current = prev.text;
          cursorPosRef.current = prev.cursor;
          redrawLine();
        }
      } else if (data === '\x1b[3~') {
        // Delete — remove the character after the cursor
        if (cursorPosRef.current < lineBufferRef.current.length) {
          pushUndo();
          const before = lineBufferRef.current.slice(0, cursorPosRef.current);
          const after = lineBufferRef.current.slice(cursorPosRef.current + 1);
          lineBufferRef.current = before + after;
          redrawLine();
        }
      } else if (code === 127) {
        // Backspace — remove the character before the cursor
        if (cursorPosRef.current > 0) {
          pushUndo();
          const wasAtEnd = cursorPosRef.current === lineBufferRef.current.length;
          const before = lineBufferRef.current.slice(0, cursorPosRef.current - 1);
          const after = lineBufferRef.current.slice(cursorPosRef.current);
          lineBufferRef.current = before + after;
          cursorPosRef.current -= 1;
          // fast path: deleting the last character on a single row is just
          // a plain erase, no need to clear+repaint the whole line
          const fitsOneRow = wasAtEnd && (getPrompt().length + lineBufferRef.current.length + 1) < getCols();
          if (fitsOneRow) {
            term.write('\b \b');
            lastCursorRowRef.current = 0;
          } else {
            redrawLine();
          }
        }
      } else if (code === 12) {
        // Ctrl+L
        term.clear();
        lastCursorRowRef.current = 0;
        redrawLine();
      } else if (code === 3) {
        // Ctrl+C
        moveToBlockEnd();
        term.write('^C\r\n');
        lastCursorRowRef.current = 0;
        lineBufferRef.current = '';
        cursorPosRef.current = 0;
        historyIndexRef.current = historyRef.current.length;
        term.write(getPrompt());
      } else if (data === '\t') {
        // Tab completion — complete the word before the cursor against open filenames
        const uptoCursor = lineBufferRef.current.slice(0, cursorPosRef.current);
        const parts = uptoCursor.split(' ');
        const partial = parts[parts.length - 1];
        if (partial.length === 0) return;
        const candidates = Object.keys(filesRef.current).filter((f) => f.startsWith(partial));
        if (candidates.length === 1) {
          insertAtCursor(candidates[0].slice(partial.length));
        } else if (candidates.length > 1) {
          moveToBlockEnd();
          term.write('\r\n' + candidates.join('  ') + '\r\n');
          lastCursorRowRef.current = 0;
          redrawLine();
        }
      } else if (data.length > 1 && !data.startsWith('\x1b')) {
        // Multi-character chunk with no escape prefix — this is a paste.
        // Split on line breaks and submit each completed line as its own command.
        const lines = data.split(/\r\n|\r|\n/);
        lines.forEach((lineText, idx) => {
          insertAtCursor(lineText);
          if (idx < lines.length - 1) {
            submitCommand();
          }
        });
      } else if (code >= 32) {
        // Printable character
        insertAtCursor(data);
      }
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    // catches panel resizes that don't fire a window resize event
    // (e.g. a draggable split-pane divider between editor and terminal)
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(containerRef.current);

    // visual cue for whether the terminal currently has keyboard focus
    const textareaEl = containerRef.current.querySelector('.xterm-helper-textarea');
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    textareaEl?.addEventListener('focus', handleFocus);
    textareaEl?.addEventListener('blur', handleBlur);

    return () => {
      clearTimeout(loadingTimer);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      textareaEl?.removeEventListener('focus', handleFocus);
      textareaEl?.removeEventListener('blur', handleBlur);
      term.dispose();
      termRef.current = null;
    };
  }, [theme]);

  return (
    <div className="relative h-full w-full p-[2px] overflow-hidden rounded-md">
      {/* continuously rotating glow, only visible while the terminal has focus */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-[40%] transition-opacity duration-300",
          isFocused ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, #58A6FF 12%, transparent 24%)',
          animation: 'quantum-terminal-border-spin 7s linear infinite',
        }}
      />
      <div className={cn(
        "relative h-full w-full rounded-md overflow-hidden",
        theme === "dark" ? "bg-[#0D1117]" : "bg-white"
      )}>
        <div ref={containerRef} className="h-full w-full" />
        {isLoading && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center",
            theme === "dark" ? "bg-[#0D1117]" : "bg-white"
          )}>
            <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      <style>{`
        @keyframes quantum-terminal-border-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
