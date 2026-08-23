import { io } from "socket.io-client";

// Explicit fallback to Render URL prevents defaulting to Vercel domain
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "https://sih-socket-server.onrender.com";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["polling", "websocket"], // MUST start with polling for Render proxy
  withCredentials: true,
});

export default socket;