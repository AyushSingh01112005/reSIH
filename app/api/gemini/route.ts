import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const product = payload.product || "mango";
    const telemetry = payload.telemetry || {};
    const triggers = payload.triggers || {};
    const status = payload.status || {};
    const deviceId = payload.deviceId || "Unknown";
    const timestamp_ms = payload.timestamp_ms || 0;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured in .env.local",
        },
        { status: 500 }
      );
    }

    const prompt = `You are an expert food preservation and cold storage bio-chemical analysis system.
Analyze the following cold storage telemetry data for a silo storing the product: "${product}".

Telemetry Data:
- Temperature: ${telemetry.temperature ?? "N/A"}°C
- Humidity: ${telemetry.humidity ?? "N/A"}%
- Raw VOC Gas levels (MQ135 index): ${telemetry.gas_raw ?? "N/A"}
- Carbon Dioxide (CO2) simulated: ${telemetry.co2_sim ?? "N/A"} ppm

Triggers / Flags:
- Alcohol Detected (Fruit fermentation): ${triggers.alcohol_detected ?? "false"}
- Motion Detected: ${triggers.motion_detected ?? "false"}
- Sound Detected: ${triggers.sound_detected ?? "false"}
- Tamper Light Triggered: ${triggers.tamper_light ?? "false"}

Status:
- Device ID: ${deviceId}
- Device Uptime: ${status.uptime_sec ?? "N/A"} seconds
- Timestamp: ${timestamp_ms} ms

Based on this data, provide a cold storage risk and shelf-life assessment.
You must return your response in the following JSON format:
{
  "riskPercentage": <number representing overall spoilage risk, 0 to 100>,
  "remainingShelfLifeDays": <predicted remaining shelf life in days, as a float/number>,
  "explanation": "<a concise explanation explaining the risk factors and, if the risk is high (e.g., above 30%), detail specific actions/remediations (like lowering temperature, increasing ventilation, checking for fermentation/spoilage) to keep the storage conditions normal and safe.>"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API returned status ${response.status}: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty response from Gemini API",
        },
        { status: 500 }
      );
    }

    const parsedData = JSON.parse(textResponse.trim());

    return NextResponse.json({
      success: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to analyze data with Gemini",
      },
      { status: 500 }
    );
  }
}
