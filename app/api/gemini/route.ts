import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const product = payload.product || "mango";
    const telemetry = payload.telemetry || {};
    const triggers = payload.triggers || {};
    const status = payload.status || {};
    const modelPrediction = payload.modelPrediction || {};
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

    const prompt = `You are the explanation layer for a cold-storage monitoring system.

This request is made only when an operator clicks the "Analyze with Gemini" button. Explain the condition of the silo using the LATEST sensor record, the SiloSense mathematical risk result, and the crop ML shelf-life result supplied below.

Important rules:
1. The risk percentage was calculated by our mathematical engine and the remaining shelf life was predicted by our crop ML model. Treat both as authoritative; do not recalculate, change, round differently, or contradict them.
2. Explain what the latest readings and trigger flags mean in plain, practical language.
3. State what the operator should do now. Give prioritised, concrete actions that match the detected condition. If conditions are normal, say what to continue monitoring. If risk is elevated, include immediate corrective checks such as cooling, ventilation, inspection for spoilage/fermentation, and checking sensors where relevant.
4. Do not claim a diagnosis that is unsupported by the supplied data. This is operational guidance, not a food-safety certification.

Product: "${product}"

Latest sensor telemetry:

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

Authoritative prediction outputs:
- Overall spoilage risk: ${modelPrediction.riskPercentage ?? "N/A"}%
- ML-predicted remaining shelf life: ${modelPrediction.remainingShelfLifeDays ?? "N/A"} days (${modelPrediction.remainingShelfLifeHours ?? "N/A"} hours)
- Model status: ${modelPrediction.status ?? "N/A"}
- Model alerts: ${Array.isArray(modelPrediction.alerts) && modelPrediction.alerts.length ? modelPrediction.alerts.join("; ") : "None"}

Return only valid JSON in this exact format:
{
  "conditionSummary": "<one concise statement of the current storage condition>",
  "explanation": "<clear explanation that refers to the supplied latest telemetry and the supplied model risk/shelf-life result>",
  "recommendedActions": ["<prioritised action 1>", "<action 2>", "<action 3>"]
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
      analysis: {
        ...parsedData,
        // These values must always come from the SiloSense mathematical model,
        // never from an LLM response.
        riskPercentage: modelPrediction.riskPercentage,
        remainingShelfLifeDays: modelPrediction.remainingShelfLifeDays,
        remainingShelfLifeHours: modelPrediction.remainingShelfLifeHours,
        status: modelPrediction.status,
      },
    });
  } catch (error: unknown) {
    console.error("Gemini Analysis Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze data with Gemini",
      },
      { status: 500 }
    );
  }
}
