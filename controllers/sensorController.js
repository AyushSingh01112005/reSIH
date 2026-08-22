import SensorReading from "@/models/SensorReading";
import connectDb from "@/lib/mongodb";

export async function createSensorReading(data) {
  await connectDb();

  const {
    deviceId,
    temperature,
    humidity,
    gas,
    co2,
    motion,
  } = data;

  const reading = await SensorReading.create({
    deviceId,
    temperature,
    humidity,
    gas,
    co2,
    motion,
  });

  // Notify Socket.IO after successful database save
  try {
    const response = await fetch(
      `${process.env.SOCKET_SERVER_URL}/internal/sensor-saved`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: reading._id.toString(),
          deviceId: reading.deviceId,
          temperature: reading.temperature,
          humidity: reading.humidity,
          gas: reading.gas,
          co2: reading.co2,
          motion: reading.motion,
        }),
      }
    );

    console.log("Socket server response:", response.status);
  } catch (error) {
    console.error("Socket notification failed:", error);
  }
  return reading;
}