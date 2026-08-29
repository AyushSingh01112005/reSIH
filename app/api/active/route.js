import { NextResponse } from "next/server";
import DeviceStatus from "@/models/DeviceStatus";
import { createDeviceStatus } from "@/controllers/deviceStatusController";
import connectDB from "@/lib/mongodb";

// Always read the newest MongoDB heartbeat rather than serving a cached GET.
export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    await connectDB();

    const latestStatus = await DeviceStatus
      .findOne({})
      .sort({ createdAt: -1 })
      .lean();

    if (!latestStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "No device status found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: latestStatus,
    });
  } catch (error) {
    console.error("Device status fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}
