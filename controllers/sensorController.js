import SensorReading from "@/models/SensorReading";
import connectDb from "@/lib/mongodb";
import { calculateCO2PPM } from "@/lib/silosense/telemetry";

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
      gas_status,
      status,
    } = data;

    // Validate device ID
    if (!deviceId) {
      throw new Error("deviceId is required");
    }

    // Validate timestamp
    if (timestamp_ms === undefined || timestamp_ms === null) {
      throw new Error("timestamp_ms is required");
    }

    // Validate telemetry
    if (!telemetry || typeof telemetry !== "object") {
      throw new Error("telemetry data is required");
    }

    const co2Ppm = calculateCO2PPM(
      telemetry.gas_raw ?? telemetry.raw_gas
    );

    // Save sensor reading. CO2 is always derived from the raw MQ135 reading
    // so device-supplied estimates cannot make dashboard and ML values diverge.
    const reading = await SensorReading.create({
      deviceId,
      timestamp_ms,

      telemetry: {
        ...telemetry,
        ...(co2Ppm === null ? {} : { co2_ppm_est: co2Ppm }),
      },

      triggers: triggers || {},

      gas_status: gas_status || {},

      status: status || {},
    });

    console.log(
      `🟢 Sensor reading saved | Device: ${deviceId} | ID: ${reading._id}`
    );

    return reading;
  } catch (error) {
    console.error("🔴 Failed to create sensor reading:", error);

    throw error;
  }
}
