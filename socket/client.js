import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://socketiosih-1.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("🟢 Socket connected! ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("🔴 Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.warn("🟡 Disconnected:", reason);
});

export default socket;