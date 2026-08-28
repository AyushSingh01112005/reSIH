import mongoose from "mongoose";

const DeviceStatusSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    status: {
      type: Number,
      required: true,
    },

    uptime_sec: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DeviceStatus ||
  mongoose.model("DeviceStatus", DeviceStatusSchema);