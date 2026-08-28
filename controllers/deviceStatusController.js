import DeviceStatus from "@/models/DeviceStatus";

export async function createDeviceStatus(data) {
  const { deviceId, status, uptime_sec } = data;

  if (!deviceId) {
    throw new Error("deviceId is required");
  }

  if (status === undefined || status === null) {
    throw new Error("status is required");
  }

  const deviceStatus = await DeviceStatus.create({
    deviceId,
    status,
    uptime_sec,
  });

  return deviceStatus;
}