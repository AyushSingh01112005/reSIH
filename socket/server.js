const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || process.env.SOCKET_PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", (reason) => {
    console.log(
      "Client disconnected:",
      socket.id,
      "-",
      reason
    );
  });
});

// Internal endpoint used by Next.js
httpServer.on("request", (req, res) => {
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

        console.log("Sensor saved event received:", data);

        // Send to every connected frontend
        io.emit("sensor:saved", data);

        console.log("sensor:saved emitted");

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
        console.error("Invalid sensor event:", error);

        res.writeHead(400, {
          "Content-Type": "application/json",
        });

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

  // Don't interfere with Socket.IO requests
  if (req.url.startsWith("/socket.io/")) {
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});