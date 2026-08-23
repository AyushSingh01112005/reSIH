const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || process.env.SOCKET_PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sih-26-cyan.vercel.app";

// Standardize origin URL by removing trailing slashes
const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, "");

const httpServer = http.createServer();

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

  // Catch socket-level errors
  socket.on("error", (err) => {
    console.error("🔴 Socket error on client", socket.id, ":", err);
  });

  socket.on("disconnect", (reason) => {
    console.warn("🟡 Client disconnected:", socket.id, "-", reason);
  });
});

// Internal endpoint triggered by Next.js API route on Vercel
httpServer.on("request", (req, res) => {
  if (req.method === "POST" && req.url === "/internal/sensor-saved") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        console.log("📥 Sensor saved event received:", data);

        // Broadcast event to all connected frontends
        io.emit("sensor:saved", data);
        console.log("📢 sensor:saved event emitted to all clients");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Sensor event emitted",
          })
        );
      } catch (error) {
        console.error("❌ Invalid sensor event payload:", error);

        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            message: "Invalid data",
          })
        );
      }
    });

    return;
  }

  // Allow native Socket.IO HTTP handshakes to proceed uninterrupted
  if (req.url.startsWith("/socket.io/")) {
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

// Explicit host binding to 0.0.0.0 for cloud platform container routing
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});