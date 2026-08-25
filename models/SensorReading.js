import mongoose from "mongoose";

const SensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      index: true,
    },

    timestamp_ms: {
      type: Number,
      index: true,
    },

    telemetry: {
      temperature: {
        type: Number,
      },

      humidity: {
        type: Number,
      },

      gas_raw: {
        type: Number,
      },

      co2_sim: {
        type: Number,
      },
    },

    triggers: {
      alcohol_detected: {
        type: Boolean,
      },

      motion_detected: {
        type: Boolean,
      },

      sound_detected: {
        type: Boolean,
      },

      tamper_light: {
        type: Boolean,
      },
    },

    status: {
      wifi_connected: {
        type: Boolean,
      },

      http_response: {
        type: Number,
      },

      uptime_sec: {
        type: Number,
      },
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