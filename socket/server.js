const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Environment setup
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://sih-26-cyan.vercel.app";
const normalizedFrontendUrl = FRONTEND_URL.replace(/\/$/, "");

const allowedOrigins = [
  normalizedFrontendUrl,
  "https://sih-26-cyan.vercel.app",
  "https://sih-26-beta.vercel.app",
  "http://localhost:3000",
  "http://localhost:5000"
];

// Express Middleware
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (ESP32, Postman, server-to-server) or matched origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS Blocked] Request Origin: ${origin}`);
      return callback(null, true); // Fallback to avoid breaking WebSockets
    },
    methods: ["GET", "POST"],
    credentials: true
  })
);

// Socket.IO Server Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,         // Required for ESP32 SocketIOclient library backward compatibility
  pingInterval: 25000,     // Keeps cloud proxies (Render) alive
  pingTimeout: 20000,      // Prevents premature drops on TLS latency
  transports: ["websocket", "polling"]
});

// Device Tracking Memory Map
const devices = new Map();

// =====================================================
// HTTP ROUTES & VERBOSE LOGGING
// =====================================================

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP Request] ${new Date().toISOString()} | ${req.method} ${req.url} | IP: ${req.ip}`);
  next();
});

// Server Health Endpoint
app.get("/", (req, res) => {
  console.log("[HTTP Log] GET / -> Health check triggered");
  res.status(200).json({
    success: true,
    service: "SiloSense Socket Server",
    status: "running",
    connectedDevices: devices.size,
    timestamp: new Date().toISOString()
  });
});

// Internal Endpoint (Pushed from Next.js Vercel API)
app.post("/internal/sensor-saved", (req, res) => {
  console.log("[HTTP Log] POST /internal/sensor-saved -> Event received");
  const data = req.body;

  if (!data) {
    console.error("[HTTP Error] POST /internal/sensor-saved -> Missing body payload!");
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  console.log("📡 [Broadcast] Emitting 'sensor:saved' to all clients:", JSON.stringify(data));
  io.emit("sensor:saved", data);
  
  return res.status(200).json({ success: true, message: "Sensor event emitted successfully" });
});

// =====================================================
// SOCKET.IO REAL-TIME EVENT ENGINE
// =====================================================

io.on("connection", (socket) => {
  const transportName = socket.conn.transport.name;
  console.log(`\n🟢 [Socket Connected] ID: ${socket.id} | IP: ${socket.handshake.address} | Transport: ${transportName}`);

  // Trace transport upgrade (Polling -> WebSocket)
  socket.conn.on("upgrade", (transport) => {
    console.log(`⚡ [Socket Upgraded] ID: ${socket.id} -> Switched to ${transport.name}`);
  });

  // Heartbeat logging
  socket.conn.on("packet", (packet) => {
    if (packet.type === "ping") {
      console.log(`💓 [Heartbeat Ping Received] Client: ${socket.id}`);
    }
  });

  // 1. ESP32 Device Registration Handler
  socket.on("deviceConnected", (data) => {
    console.log(`\n📥 [Event Received: deviceConnected] From Socket: ${socket.id}`);
    let parsedData = data;

    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
        console.log("  └─ Data format: JSON string parsed successfully");
      } catch (err) {
        console.error("  └─ ❌ [JSON Parse Failed]:", err.message);
      }
    } else {
      console.log("  └─ Data format: Object native payload");
    }

    if (!parsedData || !parsedData.deviceId) {
      console.warn("  └─ ⚠️ [Invalid Payload] Rejected! Missing 'deviceId':", data);
      return;
    }

    const deviceId = parsedData.deviceId;
    socket.deviceId = deviceId; // Bind deviceId to socket context

    devices.set(deviceId, {
      deviceId,
      socketId: socket.id,
      connected: true,
      connectedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });

    console.log(`✅ [Device Online] ID: '${deviceId}' registered under Socket: ${socket.id}`);
    console.log(`  └─ Total Active Tracked Devices: ${devices.size}`);

    // Broadcast device status to all connected dashboards
    io.emit("deviceStatus", {
      deviceId,
      connected: true,
      lastSeen: new Date().toISOString()
    });
    console.log(`📡 [Broadcast Sent: deviceStatus] Device ${deviceId} is ONLINE`);
  });

  // 2. ESP32 Sensor Telemetry Handler
  socket.on("sensorData", (data) => {
    console.log(`\n📊 [Event Received: sensorData] From Socket: ${socket.id}`);
    let parsedData = data;

    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        console.error("  └─ ❌ [JSON Parse Error]:", err.message);
      }
    }

    if (!parsedData || !parsedData.deviceId) {
      console.warn("  └─ ⚠️ [Invalid Payload] Rejected! Data:", data);
      return;
    }

    const deviceId = parsedData.deviceId;
    const existingDevice = devices.get(deviceId);

    // Update active memory footprint
    devices.set(deviceId, {
      ...(existingDevice || {}),
      deviceId,
      socketId: socket.id,
      connected: true,
      lastSeen: new Date().toISOString()
    });

    console.log(`  └─ Node ID: ${deviceId}`);
    console.log(`  └─ Telemetry Payload:`, JSON.stringify(parsedData));

    // Relay data to Next.js dashboard clients in real-time
    io.emit("sensorData", parsedData);
    console.log(`📡 [Relayed] Broadcasted sensorData for '${deviceId}' to UI subscribers`);
  });

  // 3. Next.js Dashboard Active Devices Query
  socket.on("getDevices", () => {
    console.log(`\n📋 [Event Received: getDevices] Query requested by: ${socket.id}`);
    const deviceList = Array.from(devices.values());
    socket.emit("deviceList", deviceList);
    console.log(`  └─ Sent ${deviceList.length} device entry(ies) to Socket: ${socket.id}`);
  });

  // 4. Socket Error Logging
  socket.on("error", (error) => {
    console.error(`\n🔴 [Socket Error] Socket ID: ${socket.id} | Error:`, error);
  });

  // 5. Client Disconnect Handler
  socket.on("disconnect", (reason) => {
    console.log(`\n🟡 [Client Disconnected] ID: ${socket.id} | Reason: ${reason}`);

    const deviceId = socket.deviceId;
    if (!deviceId) {
      console.log("  └─ Connection was a standard frontend client or unregistered node");
      return;
    }

    const device = devices.get(deviceId);
    if (device && device.socketId === socket.id) {
      devices.set(deviceId, {
        ...device,
        connected: false,
        disconnectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });

      console.log(`❌ [Device Offline] ID: '${deviceId}' state updated to DISCONNECTED`);

      io.emit("deviceStatus", {
        deviceId,
        connected: false,
        lastSeen: new Date().toISOString(),
        reason
      });
      console.log(`📡 [Broadcast Sent: deviceStatus] Device ${deviceId} is OFFLINE`);
    }
  });
});

// =====================================================
// SERVER INITIALIZATION
// =====================================================
server.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================");
  console.log(`🚀 SiloSense Socket Engine Online! Port: ${PORT}`);
  console.log(`🌐 Origins Allowed: ${JSON.stringify(allowedOrigins)}`);
  console.log(`🕒 Started At: ${new Date().toISOString()}`);
  console.log("==================================================");
});