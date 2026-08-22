"use client";

import axios from "axios";
import { useEffect } from "react";

export default function SensorHistory({ onData }) {
  useEffect(() => {
    console.log("SensorHistory mounted");
    console.log("Calling: /api/getSensor?limit=20");

    const getReadings = async () => {
      try {
        const res = await axios.get("/api/getSensor?limit=20");

        console.log("Sensor API response:", res);
        console.log("Sensor data:", res.data);
        console.log("Records:", res.data.data);

        onData(res.data.data || []);
      } catch (error) {
        console.error("❌ Sensor API failed");
        console.error("Status:", error.response?.status);
        console.error("Response:", error.response?.data);
        console.error("Error:", error);
      }
    };

    getReadings();
  }, [onData]);

  return null;
}