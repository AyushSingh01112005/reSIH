"use client";

import { useEffect } from "react";
import socket from "@/socket/client";

export default function Dashboard() {
  useEffect(() => {
    console.log("Dashboard mounted");

    const handleConnect = () => {
      console.log("SOCKET CONNECTED:", socket.id);
    };

    const handleSaved = (data) => {
      console.log("🔥 SAVE IN DB:", data);
    };

    const handleDisconnect = (reason) => {
      console.log("SOCKET DISCONNECTED:", reason);
    };

    socket.on("connect", handleConnect);
    socket.on("sensor:saved", handleSaved);
    socket.on("disconnect", handleDisconnect);

    // Important: socket may already be connected
    if (socket.connected) {
      console.log("Socket already connected:", socket.id);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("sensor:saved", handleSaved);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return <div>Dashboard</div>;
}