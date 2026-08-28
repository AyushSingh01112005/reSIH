import mongoose from "mongoose";

const DeviceStatusSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: Number,
    },
    uptime_sec: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

const DeviceStatus =
  mongoose.models.DeviceStatus ||
  mongoose.model("DeviceStatus", DeviceStatusSchema);

export default DeviceStatus;