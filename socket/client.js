import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://sih-socket-server.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket"], // Force direct WebSocket connection
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("🟢 Socket connected successfully! ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("🔴 Socket connection failed:", error.message, error);
});

socket.on("disconnect", (reason) => {
  console.warn("🟡 Socket disconnected:", reason);
});

export default socket;