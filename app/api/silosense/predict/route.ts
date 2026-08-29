// app/api/silosense/predict/route.ts

import { NextResponse } from "next/server";

import {
  predictSiloSense,
  type PredictionState,
  type SiloSensePayload,
} from "@/lib/silosense/prediction";

import {
  PRODUCTS,
} from "@/lib/silosense/products";
import { calculateCO2PPM } from "@/lib/silosense/telemetry";


/**
 * IMPORTANT:
 *
 * This in-memory object is only for your prototype.
 *
 * In your real SiloSense application,
 * this state should be stored in MongoDB/Redis/etc.
 */
const deviceStates:
  Record<string, PredictionState> = {};


/**
 * POST /api/silosense/predict
 */
export async function POST(
  request: Request
) {

  try {

    /**
     * 1. Receive SiloSense payload.
     */
    const payload = await request.json() as Partial<SiloSensePayload>;


    /**
     * 2. Validate basic structure.
     */
    if (
      !payload.telemetry ||
      !payload.triggers ||
      !payload.deviceId ||
      !Number.isFinite(payload.timestamp_ms) ||
      !Number.isFinite(payload.telemetry.temperature) ||
      !Number.isFinite(payload.telemetry.humidity) ||
      !Number.isFinite(payload.telemetry.gas_raw)
    ) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid SiloSense payload",
        },
        {
          status: 400,
        }
      );
    }


    /**
     * 3. Choose product.
     *
     * For now we use mango.
     *
     * Later:
     *
     * payload.product
     *
     * can determine this dynamically.
     */
    const cropKey =
      typeof payload.product === "string"
        ? payload.product.toLowerCase()
        : "mango";

    const product = PRODUCTS[cropKey];

    const co2Ppm = calculateCO2PPM(payload.telemetry.gas_raw);
    if (co2Ppm === null) {
      return NextResponse.json(
        { success: false, error: "Invalid MQ135 raw gas reading" },
        { status: 400 }
      );
    }

    // The prediction model currently calls this field co2_sim. Populate it
    // from the calibrated ADC conversion instead of trusting request input.
    payload.telemetry.co2_sim = co2Ppm;

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported crop. Choose mango, apple, tomato, or potato.",
        },
        { status: 400 }
      );
    }


    /**
     * 4. Get device state.
     */
    const previousState =
      deviceStates[
        `${payload.deviceId}:${cropKey}`
      ] ?? {

        cumulativeDamage: 0,

        lastTimestamp:
          payload.timestamp_ms,
      };


    /**
     * 5. Run SiloSense prediction.
     */
    const prediction =
      predictSiloSense(
        payload as SiloSensePayload,
        previousState,
        product
      );


    /**
     * 6. Save new state.
     */
    deviceStates[
      `${payload.deviceId}:${cropKey}`
    ] =
      prediction.state;

    /**
     * Shelf life is intentionally not calculated here. The mathematical
     * engine above provides risk; the crop ML service owns RSL prediction.
     * Keeping this request server-side avoids browser CORS configuration.
     */
    const mlResponse = await fetch(
      process.env.SHELF_LIFE_ML_URL ?? "http://127.0.0.1:8000/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop: cropKey,
          temperature: payload.telemetry.temperature,
          humidity: payload.telemetry.humidity,
          co2_ppm: co2Ppm,
          raw_gas: payload.telemetry.gas_raw,
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!mlResponse.ok) {
      const details = await mlResponse.text();
      throw new Error(`Shelf-life ML service returned ${mlResponse.status}: ${details}`);
    }

    const mlPrediction = await mlResponse.json() as {
      predicted_shelf_life_hours?: unknown;
      predicted_shelf_life_days?: unknown;
    };
    const remainingShelfLifeHours = Number(mlPrediction.predicted_shelf_life_hours);
    const remainingShelfLifeDays = Number(mlPrediction.predicted_shelf_life_days);

    if (!Number.isFinite(remainingShelfLifeHours) || !Number.isFinite(remainingShelfLifeDays)) {
      throw new Error("Shelf-life ML service returned an invalid prediction.");
    }

    const result = {
      ...prediction.result,
      remainingShelfLifeHours,
      remainingShelfLifeDays,
      shelfLifeSource: "ml" as const,
    };


    /**
     * 7. Return everything to Next.js frontend.
     */
    return NextResponse.json({

      success: true,

      deviceId:
        payload.deviceId,

      product:
        product.name,

      sensorData:
        payload.telemetry,

      triggers:
        payload.triggers,

      prediction: result,

      mlPrediction: {
        predicted_shelf_life_hours: remainingShelfLifeHours,
        predicted_shelf_life_days: remainingShelfLifeDays,
      },

      receivedAt: new Date().toISOString(),
    });


  } catch (error) {

    console.error(
      "SiloSense prediction error:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        error:
          "Prediction failed",
      },
      {
        status: 500,
      }
    );
  }
}
