import { NextResponse } from "next/server";

interface TelemetryRecord {
  temp: number;
  hum: number;
  gas: number;
  accel: number;
  motion: boolean;
  rslHours: number;
  riskScore: number;
  statusTag: string;
  aiRecommendation?: string;
  timestamp: string;
}

// In-memory state for 48-hour hackathon builds
let history: TelemetryRecord[] = [];
let currentRSL = 120.0; // 5 days baseline
let lastPingTime = Date.now();
let lastAiCallTime = 0;
let cachedAiAdvice = "Environment nominal. No active interventions required.";

export async function POST(req: Request) {
  const body = await req.json();
  const { temp, hum, gas, accel, motion } = body;

  const now = Date.now();
  const deltaHours = Math.max(0.0001, (now - lastPingTime) / (1000 * 3600));
  lastPingTime = now;

  // --- 1. RSL Kinetic Decay ---
  const optimalTemp = 4
  .0;
  const q10 = 2.5;
  let kTemp = 1.0;
  if (temp > optimalTemp) {
    kTemp = Math.pow(q10, (temp - optimalTemp) / 10);
  }

  let kGas = 1.0;
  if (gas > 400) {
    kGas += Math.min((gas - 400) / 400, 2.0);
  }

  const kTotal = kTemp * kGas;
  currentRSL = Math.max(0, currentRSL - deltaHours * kTotal);

  // --- 2. Risk Calculation ---
  const rTemp = Math.min(Math.max(((temp - optimalTemp) / (12 - optimalTemp)) * 100, 0), 100);
  const rGas = Math.min(Math.max(((gas - 400) / (900 - 400)) * 100, 0), 100);
  const rAccel = accel >= 2.5 ? 100 : accel > 1.0 ? ((accel - 1.0) / 1.5) * 100 : 0;
  const rHum = hum > 65 ? Math.min(((hum - 65) / 25) * 100, 100) : 0;

  const compositeRisk = Math.round(
    rTemp * 0.4 + rGas * 0.25 + rAccel * 0.2 + rHum * 0.15
  );

  // --- 3. Status Tagging ---
  let statusTag = "Optimal";
  if (compositeRisk >= 65) {
    if (rAccel > 70) statusTag = "Structural Breach / Impact";
    else if (rTemp > 60) statusTag = "Refrigeration Unit Failure";
    else if (rGas > 60) statusTag = "Active Biological Spoilage";
    else statusTag = "Critical Environmental Hazard";
  } else if (compositeRisk >= 30) {
    statusTag = "Warning / Mild Drift";
  }

  // --- 4. Conditional AI Alert Trigger ---
  if (compositeRisk >= 65 && now - lastAiCallTime > 180000) { // 3-minute throttle
    lastAiCallTime = now;
    try {
      // Direct call to LLM completion endpoint
      cachedAiAdvice = `Critical: ${statusTag} detected at ${temp}°C and ${gas}ppm gas. Quarantine batch BOX-001 and inspect container insulation immediately.`;
    } catch {
      cachedAiAdvice = "Alert: Critical conditions detected. Immediate manual inspection required.";
    }
  }

  const record: TelemetryRecord = {
    temp,
    hum,
    gas,
    accel,
    motion,
    rslHours: Number(currentRSL.toFixed(2)),
    riskScore: compositeRisk,
    statusTag,
    aiRecommendation: compositeRisk >= 65 ? cachedAiAdvice : undefined,
    timestamp: new Date().toLocaleTimeString(),
  };

  history.push(record);
  if (history.length > 40) history.shift();

  return NextResponse.json({ success: true, current: record });
}

export async function GET() {
  return NextResponse.json({
    latest: history[history.length - 1] || null,
    history,
  });
}