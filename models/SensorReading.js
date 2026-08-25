import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
    },

    timestamp_ms: {
      type: Number,
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

const Sensor = mongoose.model("Sensor", sensorSchema);

export default Sensor;