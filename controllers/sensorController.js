import SensorReading from "@/models/SensorReading";
import connectDb from "@/lib/mongodb";

export async function createSensorReading(data) {
  await connectDb();

  const { deviceId, temperature, humidity, gas, co2, motion } = data;

  const reading = await SensorReading.create({
    deviceId,
    temperature,
    humidity,
    gas,
    co2,
    motion,
  });

  // 1. Resolve URL with fallback and clean trailing slashes
  const baseUrl = (
    process.env.SOCKET_SERVER_URL || "https://socketiosih-1.onrender.com"
  ).replace(/\/$/, "");

  // 2. Add timeout so cold starts don't hang your database write response
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  // Notify Socket.IO server after successful DB save
  try {
    const response = await fetch(`${baseUrl}/internal/sensor-saved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        id: reading._id.toString(),
        deviceId: reading.deviceId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        gas: reading.gas,
        co2: reading.co2,
        motion: reading.motion,
      }),
    });

    clearTimeout(timeoutId);

    // 3. Catch HTTP status errors (404, 500, etc.)
    if (!response.ok) {
      console.error(
        `Socket server responded with error HTTP status: ${response.status}`
      );
    } else {
      console.log("🟢 Socket notification sent successfully:", response.status);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error("🔴 Socket notification timed out (server might be waking up)");
    } else {
      console.error("🔴 Socket notification failed:", error.message);
    }
  }

  return reading;
}