import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { createDeviceStatus } from "@/controllers/deviceStatusController";
import DeviceStatus from "@/models/DeviceStatus";

export async function GET() {
  try {
    await connectDB();

    const latestData = await DeviceStatus.findOne({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: latestData,
    });
  } catch (error) {
    console.error("Device status lookup error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch device status" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    await connectDB();
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
