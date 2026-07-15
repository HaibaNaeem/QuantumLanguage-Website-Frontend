export class QuantumSocketManager {
  private socket: WebSocket | null = null;
  public onOutputReceived: ((text: string) => void) | null = null;

  connect() {
    // 1. Prevent duplicate ghost sockets in React Strict Mode
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new WebSocket("ws://localhost:5000");

    this.socket.onopen = () => {
      if (this.onOutputReceived) this.onOutputReceived("\x1b[32m🟢 Connected to Quantum Server\x1b[0m\r\n");
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "stdout":
          if (this.onOutputReceived) this.onOutputReceived(data.payload);
          break;
        case "stderr":
          if (this.onOutputReceived) this.onOutputReceived(`\x1b[31m${data.payload}\x1b[0m`);
          break;
        case "status":
          if (this.onOutputReceived) this.onOutputReceived(`\x1b[33m[Status]: ${data.payload}\x1b[0m\r\n`);
          break;
        case "process_completion":
          if (this.onOutputReceived) this.onOutputReceived("\x1b[32m[Process Completed]\x1b[0m\r\n");
          break;
      }
    };
  }

  // 2. Add the manual disconnect function
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  runScript(code: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "run", payload: code }));
    }
  }

  sendInput(userInput: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "input", payload: userInput }));
    }
  }

  stopScript() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "stop" }));
    }
  }
}

export const socketManager = new QuantumSocketManager();