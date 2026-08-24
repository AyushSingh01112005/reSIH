import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SensorReading from "@/models/SensorReading";

export async function GET(request) {
  console.log("=================================");
  console.log("GET /api/getSensor called");

  try {
    console.log("1. Request URL:", request.url);

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;

    console.log("2. Limit:", limit);

    console.log("3. Connecting to MongoDB...");
    await connectDB();
    console.log("4. MongoDB connected successfully");

    console.log("5. Querying SensorReading...");

    const data = await SensorReading
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    console.log("6. Query successful");
    console.log("7. Records found:", data.length);
    console.log("8. Data:", data);

    console.log("9. Sending response...");

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error("❌ GET /api/getSensor ERROR");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sensor data",
        error: error.message,
      },
      { status: 500 }
    );
  }
}