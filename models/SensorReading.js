import mongoose from "mongoose";

const SensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    temperature: {
      type: Number,
      required: true,
    },

    humidity: {
      type: Number,
      required: true,
    },

    gas: {
      type: Number,
      required: true,
    },

    co2: {
      type: Number,
      required: true,
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