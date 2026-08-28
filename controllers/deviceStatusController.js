import DeviceStatus from "@/models/DeviceStatus";

export async function createDeviceStatus(data) {
  const { deviceId, status } = data;

  if (!deviceId) {
    throw new Error("deviceId is required");
  }

  if (!status) {
    throw new Error("status is required");
  }

  const deviceStatus = await DeviceStatus.create({
    deviceId,
    status,
  });

  return deviceStatus;
}
