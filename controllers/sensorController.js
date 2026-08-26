import SensorReading from "@/models/SensorReading";
import connectDb from "@/lib/mongodb";

export async function createSensorReading(data) {
  try {
    // Connect to MongoDB
    await connectDb();

    // Validate input
    if (!data || typeof data !== "object") {
      throw new Error("Invalid sensor data");
    }

    const {
      deviceId,
      timestamp_ms,
      telemetry,
      triggers,
      status,
    } = data;

    if (!deviceId) {
      throw new Error("deviceId is required");
    }

    if (timestamp_ms === undefined || timestamp_ms === null) {
      throw new Error("timestamp_ms is required");
    }

    if (!telemetry || typeof telemetry !== "object") {
      throw new Error("telemetry data is required");
    }

    // Save sensor reading
    const reading = await SensorReading.create({
      deviceId,
      timestamp_ms,
      telemetry,
      triggers: triggers || {},
      status: status || {},
    });

    console.log(
      `🟢 Sensor reading saved | Device: ${deviceId} | ID: ${reading._id}`
    );

    return reading;
  } catch (error) {
    console.error(
      "🔴 Failed to create sensor reading:",
      error
    );

    throw error;
  }
}