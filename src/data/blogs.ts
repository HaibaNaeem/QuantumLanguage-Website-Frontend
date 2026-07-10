export interface BlogBlock {
  type: 'paragraph' | 'heading' | 'code' | 'list' | 'blockquote' | 'table' | 'image';
  value: any;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readingTime: string;
  coverImage: string;
  excerpt: string;
  content: BlogBlock[];
}

export const blogs: BlogPost[] = [
  {
    id: "post-1",
    slug: "quantum-v2-1-networking-update",
    title: "Quantum v2.1: The Networking Update",
    category: "Release",
    author: "Marcus Vance (Core Architect)",
    date: "March 15, 2026",
    readingTime: "5 min read",
    coverImage: "/networking_update.png",
    excerpt: "Introducing native support for HTTP/3, improved WebSocket performance, and high-concurrency event loops for edge servers.",
    content: [
      {
        type: "paragraph",
        value: "We are thrilled to announce the official release of Quantum v2.1. This major update shifts the language's core focus to hyper-scale networking, introducing native HTTP/3 support and optimized event-driven sockets built directly into the runtime."
      },
      {
        type: "heading",
        value: { level: 2, text: "Why HTTP/3 Matters" }
      },
      {
        type: "paragraph",
        value: "Modern applications demand low-latency multiplexing. By leveraging UDP-based QUIC, Quantum v2.1 eliminates head-of-line blocking. Sockets can now recover instantly from network changes without dropping state—critical for mobile applications roaming between cell networks."
      },
      {
        type: "code",
        value: {
          language: "quantum",
          code: `import { Server, http3 } from "quantum:net"

const server = new Server({
    protocol: http3,
    port: 443,
    certs: {
        key: "./certs/key.pem",
        cert: "./certs/cert.pem"
    }
});

server.on("request", (req, res) => {
    res.writeHeader(200, { "Content-Type": "application/json" });
    res.end({ status: "success", data: "Connected via HTTP/3" });
});

await server.start();`
        }
      },
      {
        type: "heading",
        value: { level: 2, text: "Throughput & Efficiency Benchmarks" }
      },
      {
        type: "paragraph",
        value: "Compared to previous versions, v2.1 cuts down memory consumption under concurrent connections. Our tests indicate a significant improvement in connection throughput when scaling past 100,000 active streams."
      },
      {
        type: "table",
        value: {
          headers: ["Protocol", "Concurrent Conn.", "Throughput (req/sec)", "Avg Latency (ms)"],
          rows: [
            ["HTTP/1.1 (Quantum v2.0)", "10,000", "45,000", "12.4ms"],
            ["HTTP/2 (Quantum v2.0)", "50,000", "120,000", "8.2ms"],
            ["HTTP/3 (Quantum v2.1)", "100,000", "340,000", "1.9ms"]
          ]
        }
      },
      {
        type: "blockquote",
        value: {
          text: "Quantum's HTTP/3 implementation has allowed us to reduce our edge load-balancer footprint by nearly 40% while maintaining rock-solid response times.",
          cite: "Tech Lead at CyberScale"
        }
      },
      {
        type: "heading",
        value: { level: 3, text: "Key Changes in This Update" }
      },
      {
        type: "list",
        value: {
          ordered: false,
          items: [
            "Native QUIC transport bindings written in optimized Rust and exposed through quantum:net.",
            "Integrated Zero-RTT handshake for super-fast reconnection.",
            "Re-engineered WebSocket core providing automatic socket pooling and frame compression.",
            "Upgraded standard libraries with full typing support for all async handlers."
          ]
        }
      },
      {
        type: "paragraph",
        value: "Quantum v2.1 is backward compatible with all v2.0 codebase structures. You can grab the latest build through the official installation command today."
      }
    ]
  },
  {
    id: "post-2",
    slug: "securing-the-edge-with-quantum",
    title: "Securing the Edge with Quantum",
    category: "Tutorial",
    author: "Elena Rostova (Security Dev)",
    date: "March 10, 2026",
    readingTime: "7 min read",
    coverImage: "/securing_edge.png",
    excerpt: "Learn how to use Quantum's built-in cryptographic functions to generate secure session keys and protect APIs at the edge.",
    content: [
      {
        type: "paragraph",
        value: "Deploying applications at the edge exposes them directly to high volumes of automated bot scanners and brute-force traffic. Securing these APIs requires robust cryptography that performs with minimal CPU cycle overhead."
      },
      {
        type: "heading",
        value: { level: 2, text: "Using Quantum's Cryptographic APIs" }
      },
      {
        type: "paragraph",
        value: "Quantum includes a native security module `quantum:crypto` that handles key generation and cipher operations using hardware-accelerated instructions. Let's walk through generating a session key and encrypting a JSON payload."
      },
      {
        type: "code",
        value: {
          language: "quantum",
          code: `import { generateKey, encrypt, decrypt } from "quantum:crypto"

// Generate a high-entropy symmetric key
const secretKey = await generateKey({
    algorithm: "AES-GCM",
    length: 256
});

// Prepare session payload
const payload = JSON.stringify({
    userId: "usr_99824",
    roles: ["admin", "developer"],
    exp: Date.now() + 3600000
});

// Encrypt payload with random IV
const { ciphertext, iv, tag } = await encrypt({
    key: secretKey,
    data: payload
});

console.log("Encrypted Session: " + ciphertext);`
        }
      },
      {
        type: "heading",
        value: { level: 3, text: "Recommended Security Checklists" }
      },
      {
        type: "list",
        value: {
          ordered: true,
          items: [
            "Never store long-lived keys directly in your codebase. Use Environment Variables.",
            "Always include a Cryptographic Initialization Vector (IV) for every encryption operation.",
            "Use AES-GCM or ChaCha20-Poly1305 protocols to ensure message integrity and authenticity.",
            "Set appropriate expiration timestamps inside session tokens to minimize replay attacks."
          ]
        }
      },
      {
        type: "blockquote",
        value: {
          text: "Hardware-accelerated cryptography in edge runtimes isn't just about security—it directly impacts response times and cloud CPU spend.",
          cite: "Elena Rostova"
        }
      },
      {
        type: "paragraph",
        value: "By keeping the security layer integrated into the language runtime itself, Quantum eliminates third-party dependencies and reduces vulnerability surfaces."
      }
    ]
  },
  {
    id: "post-3",
    slug: "quantum-vs-the-world-benchmark",
    title: "Quantum vs. The World: A Benchmark",
    category: "Performance",
    author: "Devon Chen (Performance Engineer)",
    date: "March 05, 2026",
    readingTime: "6 min read",
    coverImage: "/benchmark_comparison.png",
    excerpt: "We put Quantum up against Python, Ruby, and Node.js in a series of real-world performance tests and resource utilization benchmarks.",
    content: [
      {
        type: "paragraph",
        value: "When building Quantum, we wanted to bridge the gap between human-readable developer ergonomics and machine-level runtime speed. To test how we've done, we ran standard performance benchmarks measuring memory overhead, parsing speed, and I/O execution."
      },
      {
        type: "heading",
        value: { level: 2, text: "Benchmark Methodology" }
      },
      {
        type: "paragraph",
        value: "Each language runtime was hosted on an identical virtual environment (4 vCPU, 8GB RAM). The script tasks involved calculating prime numbers up to 10 million (CPU-bound) and handling 10,000 read-write filesystem transactions (I/O-bound)."
      },
      {
        type: "table",
        value: {
          headers: ["Language / Runtime", "Prime Comp. (sec)", "I/O Speed (ms)", "Startup Time (ms)", "Peak Memory (MB)"],
          rows: [
            ["Python 3.12 (CPython)", "14.2s", "824ms", "28ms", "42MB"],
            ["Ruby 3.3 (YJIT)", "8.9s", "711ms", "32ms", "56MB"],
            ["Node.js v20 (V8)", "1.8s", "148ms", "45ms", "84MB"],
            ["Quantum v2.1", "1.2s", "84ms", "8ms", "18MB"]
          ]
        }
      },
      {
        type: "heading",
        value: { level: 2, text: "Analyzing the Results" }
      },
      {
        type: "paragraph",
        value: "The data shows that Quantum performs faster startup routines, taking just 8 milliseconds to execute. Our compiler design generates compact, static memory blocks, which allows the runtime to peak at just 18MB of RAM under heavy CPU usage."
      },
      {
        type: "blockquote",
        value: {
          text: "Quantum's hybrid JIT/AOT compiler compilation allows it to outrun traditional dynamic interpreters while keeping memory footprints extremely light.",
          cite: "Devon Chen"
        }
      },
      {
        type: "paragraph",
        value: "This makes Quantum perfect for ephemeral microservices, serverless functions, and resource-constrained microcontrollers where every megabyte and millisecond translates to cost savings."
      }
    ]
  }
];
