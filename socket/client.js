import { io } from "socket.io-client";

// Explicit fallback to Render URL prevents defaulting to Vercel domain
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://sih-socket-server.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["polling", "websocket"], // MUST start with polling for Render proxy
  withCredentials: true,
});

// Event Listeners for Debugging Connection Status in Browser Console
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