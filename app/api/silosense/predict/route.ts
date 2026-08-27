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
    const payload = await request.json();


    /**
     * 2. Validate basic structure.
     */
    if (
      !payload.telemetry ||
      !payload.triggers ||
      !payload.deviceId
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
    const product =
      PRODUCTS.mango;


    /**
     * 4. Get device state.
     */
    const previousState =
      deviceStates[
        payload.deviceId
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
        payload,
        previousState,
        product
      );


    /**
     * 6. Save new state.
     */
    deviceStates[
      payload.deviceId
    ] =
      prediction.state;


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

      prediction:
        prediction.result,
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