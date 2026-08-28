import { NextResponse } from "next/server";
import { createDeviceStatus } from "@/controllers/deviceStatusController";

export async function POST(request) {
  try {
    const body = await request.json();

    const status = await createDeviceStatus(body);

    return NextResponse.json(
      {
        success: true,
        message: "Device status saved successfully",
        data: status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Device status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 }
    );
  }
}
