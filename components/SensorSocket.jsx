"use client";

import { useEffect } from "react";
import socket from "@/socket/client";

const SensorSocket = ({ onSensorUpdate, onConnectionChange }) => {
  useEffect(() => {
    console.log("SensorSocket mounted");

    const handleConnect = () => {
      console.log("SOCKET CONNECTED:", socket.id);

      onConnectionChange?.(true);
    };

    const handleSaved = (data) => {
      console.log("🔥 SENSOR SAVED:", data);

      // Send latest sensor data to parent
      onSensorUpdate?.(data);
    };

    const handleDisconnect = (reason) => {
      console.log("SOCKET DISCONNECTED:", reason);

      onConnectionChange?.(false);
    };

    socket.on("connect", handleConnect);
    socket.on("sensor:saved", handleSaved);
    socket.on("disconnect", handleDisconnect);

    // Socket may already be connected
    if (socket.connected) {
      console.log("Socket already connected:", socket.id);
      onConnectionChange?.(true);
    }

    return () => {
      console.log("SensorSocket unmounted");

      socket.off("connect", handleConnect);
      socket.off("sensor:saved", handleSaved);
      socket.off("disconnect", handleDisconnect);
    };
  }, [onSensorUpdate, onConnectionChange]);

  return null;
};

export default SensorSocket;