const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || process.env.SOCKET_PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sih-26-cyan.vercel.app";

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, "");

const httpServer = http.createServer((req, res) => {
  // 1. Let Socket.IO handle all its internal polling & websocket requests
  if (req.url && req.url.startsWith("/socket.io/")) {
    return;
  }

  // 2. Handle CORS Preflight for custom HTTP endpoints
  const origin = req.headers.origin;
  const allowedOrigins = [
    normalizedFrontendUrl,
    "https://sih-26-cyan.vercel.app",
    "https://sih-26-beta.vercel.app",
    "http://localhost:3000",
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 3. Internal endpoint
  if (req.method === "POST" && req.url === "/internal/sensor-saved") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        io.emit("sensor:saved", data);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "Sensor event emitted" }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Invalid data" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

const io = new Server(httpServer, {
  cors: {
    origin: [
      normalizedFrontendUrl,
      "https://sih-26-cyan.vercel.app",
      "https://sih-26-beta.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected successfully:", socket.id);

  socket.on("error", (err) => {
    console.error("🔴 Socket error on client", socket.id, ":", err);
  });

  socket.on("disconnect", (reason) => {
    console.warn("🟡 Client disconnected:", socket.id, "-", reason);
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});