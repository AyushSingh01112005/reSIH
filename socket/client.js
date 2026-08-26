import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://socketiosih-1.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

// =====================================================
// GLOBAL SOCKET LISTENERS & LOGGING
// =====================================================

socket.on("connect", () => {
  console.log("");
  console.log("🟢 CONNECTED TO SILOSENSE SOCKET SERVER");
  console.log("Socket ID:", socket.id);
  console.log("Server:", SOCKET_URL);

  socket.emit("getDevices");
});

socket.on("connect_error", (error) => {
  console.error("");
  console.error("🔴 SOCKET CONNECTION ERROR");
  console.error("Message:", error.message);
  console.error("Server:", SOCKET_URL);
});

socket.on("disconnect", (reason) => {
  console.warn("");
  console.warn("🟡 SOCKET DISCONNECTED");
  console.warn("Reason:", reason);
});

socket.on("deviceStatus", (data) => {
  if (!data || !data.deviceId) return;

  if (data.connected === true) {
    console.log(`🟢 ${data.deviceId} ONLINE`);
  } else {
    console.log(`🔴 ${data.deviceId} OFFLINE`);
    console.log("Reason:", data.reason || "Unknown");
  }
});

socket.on("deviceList", (devices) => {
  console.log("📋 DEVICE LIST:", devices);
});

socket.on("sensorData", (data) => {
  console.log("📊 LIVE SENSOR DATA:", data);
});

socket.on("sensor:saved", (data) => {
  console.log("💾 SENSOR SAVED:", data);
});

// =====================================================
// REACT HOOK WITH DYNAMIC POLLING (2s / 10s)
// =====================================================

export function useSiloSenseSocket() {
  const [devices, setDevices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestSensorData, setLatestSensorData] = useState(null);

  useEffect(() => {
    // 1. Connection Sync
    function handleConnect() {
      setIsConnected(true);
      socket.emit("getDevices");
    }

    // 2. Server Disconnect -> Instant Offline Fallback
    function handleDisconnect() {
      setIsConnected(false);
      setDevices((prevDevices) =>
        prevDevices.map((device) => ({
          ...device,
          connected: false,
        }))
      );
    }

    // 3. Receive Full Device List
    function handleDeviceList(list) {
      if (Array.isArray(list)) {
        setDevices(list);
      }
    }

    // 4. Instant Device Status Broadcast
    function handleDeviceStatus(statusData) {
      if (!statusData || !statusData.deviceId) return;

      setDevices((prevDevices) => {
        const index = prevDevices.findIndex(
          (d) => d.deviceId === statusData.deviceId
        );

        if (index > -1) {
          const updated = [...prevDevices];
          updated[index] = {
            ...updated[index],
            connected: statusData.connected,
            lastSeen: statusData.lastSeen || new Date().toISOString(),
          };
          return updated;
        }

        socket.emit("getDevices");
        return prevDevices;
      });
    }

    // 5. Sensor Data Update
    function handleSensorData(data) {
      setLatestSensorData(data);
    }

    // Attach Listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("deviceList", handleDeviceList);
    socket.on("deviceStatus", handleDeviceStatus);
    socket.on("sensorData", handleSensorData);

    // Initial state check
    if (socket.connected) {
      setIsConnected(true);
      socket.emit("getDevices");
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("deviceList", handleDeviceList);
      socket.off("deviceStatus", handleDeviceStatus);
      socket.off("sensorData", handleSensorData);
    };
  }, []);

  // Compute total active connected devices
  const activeDevices = devices.filter((d) => d.connected === true);
  const totalConnected = activeDevices.length;
  const isSystemOffline = !isConnected || totalConnected === 0;

  // Dynamic Polling Interval: 10s if devices connected, 2s if no devices connected
  useEffect(() => {
    const pollIntervalMs = totalConnected > 0 ? 10000 : 2000;

    const intervalId = setInterval(() => {
      if (socket.connected) {
        console.log(
          `🔍 Checking ESP32 status (Interval: ${pollIntervalMs / 1000}s)...`
        );
        socket.emit("getDevices");
      } else {
        console.warn("⚠️ Socket server not connected");
      }
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [totalConnected]);

  return {
    socket,
    devices,
    activeDevices,
    totalConnected,
    isSystemOffline,
    isConnected,
    latestSensorData,
  };
}

export default socket;