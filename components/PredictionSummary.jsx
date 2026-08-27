"use client";

import React from "react";

export default function PredictionSummary({ prediction }) {
  if (!prediction) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500 backdrop-blur-sm animate-pulse">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 text-lg animate-bounce">
          🤖
        </div>
        <p className="mt-3 text-sm font-medium">Analyzing environmental telemetry for AI spoilage prediction...</p>
      </div>
    );
  }

  const {
    product = "Mango",
    riskPercentage = 0,
    remainingShelfLifeDays = 0,
    remainingShelfLifeHours = 0,
    deteriorationRate = 1.0,
    temperatureFactor = 1.0,
    humidityFactor = 1.0,
    gasFactor = 1.0,
    co2Factor = 1.0,
    temperatureRisk = 0,
    humidityRisk = 0,
    gasRisk = 0,
    co2Risk = 0,
    status = "NORMAL",
    explanation = "System is operating within normal parameters.",
    alerts = []
  } = prediction;

  // Determine status color scheme
  let statusColor = "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5";
  let ringColor = "#10b981";
  let pulseColor = "bg-emerald-500";
  let bgAmbient = "bg-emerald-500";

  if (status === "WARNING" || (riskPercentage >= 30 && riskPercentage < 60)) {
    statusColor = "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5";
    ringColor = "#f59e0b";
    pulseColor = "bg-amber-500";
    bgAmbient = "bg-amber-500";
  } else if (status === "CRITICAL" || riskPercentage >= 60) {
    statusColor = "from-red-500/10 to-rose-500/10 text-red-400 border-red-500/20 shadow-red-500/5";
    ringColor = "#ef4444";
    pulseColor = "bg-red-500";
    bgAmbient = "bg-red-500";
  }

  // Get product emoji helper
  const getProductEmoji = (prodName) => {
    const name = prodName ? prodName.toLowerCase() : "";
    if (name.includes("mango")) return "🥭";
    if (name.includes("apple")) return "🍎";
    if (name.includes("banana")) return "🍌";
    if (name.includes("potato")) return "🥔";
    if (name.includes("tomato")) return "🍅";
    if (name.includes("orange")) return "🍊";
    if (name.includes("grape")) return "🍇";
    return "📦";
  };

  // SVG Circular Math
  const radius = 54;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (riskPercentage / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/60 to-slate-950/80 p-6 backdrop-blur-md transition-all hover:border-slate-700/60">
      {/* Decorative ambient background glow */}
      <div className={`absolute -right-24 -top-24 h-48 w-48 rounded-full filter blur-[100px] opacity-10 ${bgAmbient} transition-all duration-1000`} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        
        {/* Left Section: Circular Risk Gauge & Status */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-800/40 bg-slate-950/30 p-5 text-center lg:w-72">
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="h-32 w-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={normalizedRadius}
                stroke="#1e293b"
                strokeWidth={stroke}
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={normalizedRadius}
                className="transition-all duration-1000 ease-out"
                stroke={ringColor}
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black tracking-tight text-white">
                {riskPercentage}%
              </span>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Spoilage Risk
              </span>
            </div>
          </div>

          <div className="w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs">
              <span className="text-sm">{getProductEmoji(product)}</span>
              <span className="font-semibold text-slate-300">{product} Silo</span>
            </div>

            <div className={`mt-3 flex items-center justify-center gap-2 rounded-lg border bg-gradient-to-r px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm ${statusColor} transition-all duration-500`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`}></span>
              </span>
              {status}
            </div>
          </div>
        </div>

        {/* Center Section: AI Explanation & Alerts */}
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full">
                AI Prediction
              </span>
              <span className="text-xs text-slate-500 font-mono">Real-time Analysis</span>
            </div>
            
            <h3 className="mt-2 text-lg font-bold text-white tracking-tight">
              SiloSense Spoilage Predictor
            </h3>
            
            <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold leading-relaxed text-slate-300">
                {explanation}
              </p>
            </div>
          </div>

          {/* Active Alerts */}
          <div>
            <h5 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
              Active Assessment Alerts ({alerts.length})
            </h5>
            <div className="flex flex-col gap-2">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-300/95">
                    <span className="mt-0.5">⚠️</span>
                    <span className="font-medium leading-normal">{alert}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
                  <span>✅</span>
                  <span className="font-medium">All telemetry signals are within normal operating bounds.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Shelf Life & Breakdown */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-800/40 bg-slate-950/30 p-5 lg:w-80">
          
          {/* Estimated Shelf Life */}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">
              Remaining Shelf Life
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {remainingShelfLifeDays.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">Days</span>
              <span className="text-[11px] font-mono text-slate-500 ml-1">
                ({remainingShelfLifeHours.toFixed(0)} hrs)
              </span>
            </div>
            
            {/* Health Bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  remainingShelfLifeDays > 6 
                    ? "bg-emerald-500" 
                    : remainingShelfLifeDays > 3 
                    ? "bg-amber-500" 
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(100, (remainingShelfLifeDays / 10) * 100)}%`
                }}
              />
            </div>
          </div>

          <div className="h-px bg-slate-800/40" />

          {/* Environmental Drivers Breakdown */}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-2">
              Environmental Risk Factors
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              
              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-800/20">
                <span className="text-slate-500 block text-[9px] font-semibold uppercase">Temperature</span>
                <div className="mt-0.5 flex justify-between items-center">
                  <span className="font-bold text-slate-300">+{temperatureRisk}%</span>
                  <span className="font-mono text-[9px] text-blue-400">{temperatureFactor.toFixed(2)}x</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-800/20">
                <span className="text-slate-500 block text-[9px] font-semibold uppercase">Gas / VOCs</span>
                <div className="mt-0.5 flex justify-between items-center">
                  <span className="font-bold text-slate-300">+{gasRisk}%</span>
                  <span className="font-mono text-[9px] text-amber-500">{gasFactor.toFixed(2)}x</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-800/20">
                <span className="text-slate-500 block text-[9px] font-semibold uppercase">Carbon Dioxide</span>
                <div className="mt-0.5 flex justify-between items-center">
                  <span className="font-bold text-slate-300">+{co2Risk}%</span>
                  <span className="font-mono text-[9px] text-purple-400">{co2Factor.toFixed(2)}x</span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900/30 p-2 border border-slate-800/20">
                <span className="text-slate-500 block text-[9px] font-semibold uppercase">Humidity</span>
                <div className="mt-0.5 flex justify-between items-center">
                  <span className="font-bold text-slate-300">+{humidityRisk}%</span>
                  <span className="font-mono text-[9px] text-cyan-400">{humidityFactor.toFixed(2)}x</span>
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
            <span>Deterioration Rate:</span>
            <span className={`font-bold ${deteriorationRate > 1.2 ? "text-amber-400" : "text-emerald-400"}`}>
              {deteriorationRate.toFixed(4)}x
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
