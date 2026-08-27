"use client";

import React, { useMemo } from "react";

export default function DashboardAlerts({
  isDeviceOnline,
  lastUpdate,
  prediction,
  activeAlert,
  onDismissAlert
}) {
  const lastUpdateFormatted = useMemo(() => {
    if (!lastUpdate) return "N/A";
    const date = new Date(lastUpdate);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " (" + date.toLocaleDateString() + ")";
  }, [lastUpdate]);

  const hasHighRisk = useMemo(() => {
    if (!prediction) return false;
    return (
      prediction.riskPercentage >= 40 ||
      prediction.status === "WARNING" ||
      prediction.status === "CRITICAL"
    );
  }, [prediction]);

  return (
    <div className="w-full space-y-4">
      {/* 1. DISCONNECTION ALERT (Shows when device is offline) */}
      {!isDeviceOnline && (
        <div className="relative overflow-hidden rounded-2xl border border-red-950/60 bg-gradient-to-r from-red-950/30 via-amber-950/20 to-red-950/30 p-5 shadow-lg backdrop-blur-md transition-all duration-300">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500 animate-pulse" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-2xl text-red-400 animate-pulse">
                ⚠️
              </div>
              <div>
                <h3 className="text-md font-bold tracking-tight text-red-400">
                  NodeMCU ESP12E Disconnected
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-300">
                  System is currently offline. We are seeing <span className="font-extrabold text-amber-400 underline decoration-wavy decoration-amber-500 decoration-2">PREVIOUS DATA</span> last received at <span className="font-mono text-white bg-slate-950/60 px-1.5 py-0.5 rounded">{lastUpdateFormatted}</span>, not current telemetry.
                </p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  ⚠️ Notice: The environmental values, charts, and predictions shown below reflect historical records and do not represent current storage conditions in real-time.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Viewing History
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. HIGH RISK WARNING ALERT (Shows when device is online but prediction risk is high) */}
      {isDeviceOnline && activeAlert && prediction && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-pulse">
          <div className={`absolute left-0 top-0 h-full w-1.5 ${prediction.status === "CRITICAL" ? "bg-red-500" : "bg-amber-500"}`} />
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                prediction.status === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                🚨
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-md font-bold tracking-tight ${prediction.status === "CRITICAL" ? "text-red-400" : "text-amber-400"}`}>
                    AI High Spoilage Risk Warning — {prediction.status}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Live telemetry</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {prediction.explanation}
                </p>
                
                {/* Active Alerts Bullet List */}
                {prediction.alerts && prediction.alerts.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1">Risk Factors Detected:</span>
                    <ul className="space-y-1.5">
                      {prediction.alerts.map((alert, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-red-300/90 font-medium">
                          <span className="text-red-400">⚡</span>
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Badge & Spoilage percentage */}
            <div className="flex shrink-0 items-center gap-3 self-center sm:self-auto">
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk Factor</span>
                <span className={`text-3xl font-black ${prediction.status === "CRITICAL" ? "text-red-400" : "text-amber-400"}`}>
                  {prediction.riskPercentage}%
                </span>
              </div>
              {onDismissAlert && (
                <button
                  onClick={onDismissAlert}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
