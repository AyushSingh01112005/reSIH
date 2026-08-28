import { NextResponse } from "next/server";
import { createSensorReading } from "@/controllers/sensorController";

export async function POST(request) {
  
  try {
    const body = await request.json();

    const reading = await createSensorReading(body);

    return NextResponse.json(
      {
        success: true,
        message: "Sensor reading saved successfully",
        data: reading,
      },
      { status: 201 }
    );  
  } catch (error) {
    console.error("Sensor reading error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
}