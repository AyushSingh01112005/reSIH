import mongoose from "mongoose";

const SensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      index: true,
    },

    temperature: {
      type: Number,
    },

    humidity: {
      type: Number,
    },

    gas: {
      type: Number,
    },

    co2: {
      type: Number,
    },

    motion: {
      type: Boolean,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const SensorReading =
  mongoose.models.SensorReading ||
  mongoose.model("SensorReading", SensorReadingSchema);

export default SensorReading;