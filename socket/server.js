const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://sih-26-cyan.vercel.app";

const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, "");

const allowedOrigins = [
  normalizedFrontendUrl,
  "https://sih-26-cyan.vercel.app",
  "https://sih-26-beta.vercel.app",
  "http://localhost:3000",
];

const httpServer = http.createServer((req, res) => {
  // =========================
  // HEALTH CHECK
  // =========================
  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        success: true,
        service: "socket-server",
        status: "ok",
      })
    );

    return;
  }

  // =========================
  // CORS
  // =========================
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // =========================
  // OPTIONS / PREFLIGHT
  // =========================
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // =========================
  // INTERNAL SENSOR EVENT
  // =========================
  if (
    req.method === "POST" &&
    req.url === "/internal/sensor-saved"
  ) {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        console.log("📡 Sensor saved event:", data);

        io.emit("sensor:saved", data);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: true,
            message: "Sensor event emitted",
          })
        );
      } catch (error) {
        console.error("❌ Invalid sensor event:", error);

        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            message: "Invalid JSON data",
          })
        );
      }
    });

    return;
  }

  // =========================
  // UNKNOWN HTTP ROUTE
  // =========================
  res.writeHead(404, {
    "Content-Type": "text/plain",
  });

  res.end("Not Found");
});

// =========================
// SOCKET.IO SERVER
// =========================
const io = new Server(httpServer, {
  path: "/socket.io",

  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },

  transports: ["polling", "websocket"],

  allowEIO3: false,
});

// =========================
// SOCKET CONNECTION
// =========================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log(
      "🟡 Client disconnected:",
      socket.id,
      "-",
      reason
    );
  });

  socket.on("error", (error) => {
    console.error(
      "🔴 Socket error:",
      socket.id,
      error
    );
  });
});

// =========================
// START SERVER
// =========================
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Socket.IO server running on port ${PORT}`
  );

  console.log(
    `🌐 Frontend URL: ${normalizedFrontendUrl}`
  );
});