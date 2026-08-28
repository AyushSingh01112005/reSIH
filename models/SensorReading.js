import mongoose from "mongoose";

const SensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    timestamp_ms: {
      type: Number,
      required: true,
      index: true,
    },

    telemetry: {
      temperature: {
        type: Number,
      },

      humidity: {
        type: Number,
      },

      accel_x: {
        type: Number,
      },

      accel_y: {
        type: Number,
      },

      accel_z: {
        type: Number,
      },

      gas_raw: {
        type: Number,
      },

      mq135_voltage: {
        type: Number,
      },

      mq135_rs_kohm: {
        type: Number,
      },

      mq135_r0_kohm: {
        type: Number,
      },

      mq135_rs_r0: {
        type: Number,
      },

      nh3_ppm_est: {
        type: Number,
      },

      co2_ppm_est: {
        type: Number,
      },

      co_ppm_est: {
        type: Number,
      },

      alcohol_ppm_est: {
        type: Number,
      },

      toluene_ppm_est: {
        type: Number,
      },

      acetone_ppm_est: {
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

    gas_status: {
      type: {
        type: String,
      },

      ppm_is_estimated: {
        type: Boolean,
      },

      r0_calibrated: {
        type: Boolean,
      },

      note: {
        type: String,
      },
    },

    status: {
      wifi_connected: {
        type: Boolean,
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
