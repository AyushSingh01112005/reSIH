"use client";

import { useEffect, useState } from "react";
import { calculateCO2PPM } from "@/lib/silosense/telemetry";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

export default function DataPage() {
  const [sensorHistory, setSensorHistory] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [error, setError] = useState("");
  const [predictionError, setPredictionError] = useState("");

  // =====================================================
  // NORMALIZE SENSOR DATA
  // =====================================================

  const normalizeReading = (reading) => {
    return {
      ...reading,

      temperature: Number(
        reading.telemetry?.temperature ??
          reading.temperature ??
          0
      ),

      humidity: Number(
        reading.telemetry?.humidity ??
          reading.humidity ??
          0
      ),

      gas: Number(
        reading.telemetry?.raw_gas ??
          reading.telemetry?.gas_raw ??
          reading.raw_gas ??
          reading.gas ??
          0
      ),

      co2:
        calculateCO2PPM(
          reading.telemetry?.raw_gas ??
            reading.telemetry?.gas_raw ??
            reading.raw_gas ??
            reading.gas
        ) ??
        Number(
          reading.telemetry?.co2_ppm_est ??
            reading.telemetry?.co2_ppm ??
            reading.telemetry?.co2_sim ??
            reading.co2_ppm ??
            reading.co2 ??
            0
        ),

      createdAt:
        reading.createdAt ??
        reading.timestamp ??
        null,

      deviceId:
        reading.deviceId ??
        "ESP8266-001",

      timestamp_ms:
        Number(
          reading.timestamp_ms ??
            new Date(
              reading.createdAt ??
                reading.timestamp ??
                Date.now()
            ).getTime()
        ),
    };
  };

  // =====================================================
  // FETCH SENSOR + PREDICTION
  // =====================================================

  useEffect(() => {
    let active = true;

    const fetchLatestData = async () => {
      try {
        setError("");

        // =================================================
        // 1. GET LAST 50 SENSOR READINGS
        // =================================================

        const res = await fetch(
          "/api/getSensor?limit=50",
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch sensor data: ${res.status}`
          );
        }

        const json = await res.json();

        if (!active) return;

        if (
          !json.success ||
          !Array.isArray(json.data)
        ) {
          throw new Error(
            "Invalid sensor data received"
          );
        }

        // Sensor API is working
        setIsConnected(true);

        // =================================================
        // 2. NORMALIZE LAST 50 READINGS
        // =================================================

        const normalized = json.data.map(
          normalizeReading
        );

        const history = normalized.slice(0, 50);

        setSensorHistory(history);

        // =================================================
        // 3. CHECK WHETHER DATA EXISTS
        // =================================================

        if (history.length === 0) {
          setSensorData(null);
          return;
        }

        // =================================================
        // 4. GET LATEST READING
        // =================================================

        const latest = history[0];

        setSensorData(latest);

        setLastUpdate(
          new Date(
            latest.createdAt ??
              latest.timestamp_ms ??
              Date.now()
          )
        );

        // =================================================
        // 5. CREATE PAYLOAD FOR EXISTING
        //    /api/silosense/predict ROUTE
        // =================================================

        /*
          IMPORTANT:

          Your Next.js backend expects:

          {
            deviceId,
            timestamp_ms,
            telemetry: {
              temperature,
              humidity,
              gas_raw,
              co2_sim
            },
            triggers
          }
        */

        const predictionPayload = {
          deviceId:
            latest.deviceId ||
            "ESP8266-001",

          timestamp_ms:
            Number(
              latest.timestamp_ms
            ) || Date.now(),

          telemetry: {
            temperature:
              Number(
                latest.temperature
              ),

            humidity:
              Number(
                latest.humidity
              ),

            gas_raw:
              Number(
                latest.gas
              ),

            co2_sim:
              Number(
                latest.co2
              ),
          },

          triggers: {
            alcohol_detected: false,
            motion_detected: false,
            sound_detected: false,
            tamper_light: false,
          },

          /*
            Your backend currently defaults
            to mango unless payload.product
            is provided.

            We explicitly send apple.
          */

          product: "apple",
        };

        console.log(
          "Sending to /api/silosense/predict:",
          predictionPayload
        );

        // =================================================
        // 6. CALL YOUR NEXT.JS BACKEND
        // =================================================

        setPredictionLoading(true);
        setPredictionError("");

        const predResponse = await fetch(
          "/api/silosense/predict",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              predictionPayload
            ),

            cache: "no-store",
          }
        );

        // =================================================
        // 7. READ RESPONSE
        // =================================================

        const predText =
          await predResponse.text();

        console.log(
          "Prediction status:",
          predResponse.status
        );

        console.log(
          "Prediction response:",
          predText
        );

        if (!predResponse.ok) {
          throw new Error(
            `Prediction API failed (${predResponse.status}): ${predText}`
          );
        }

        let predJson;

        try {
          predJson =
            JSON.parse(predText);
        } catch {
          throw new Error(
            "Prediction API returned invalid JSON"
          );
        }

        if (!active) return;

        console.log(
          "Prediction JSON:",
          predJson
        );

        // =================================================
        // 8. NORMALIZE PREDICTION RESPONSE
        // =================================================

        /*
          Your current Next.js route returns:

          {
            success: true,
            deviceId: "...",
            product: "Apple",
            sensorData: {...},
            triggers: {...},
            prediction: {...},
            mlPrediction: {
              predicted_shelf_life_hours: 362.68,
              predicted_shelf_life_days: 15.11
            }
          }

          We convert that into the format
          your UI expects.
        */

        let finalPrediction = null;

        // -----------------------------------------------
        // CASE 1:
        // Existing Next.js route response
        // -----------------------------------------------

        if (
          predJson.mlPrediction
        ) {
          finalPrediction = {
            crop:
              predictionPayload.product,

            input_data: {
              crop:
                predictionPayload.product,

              temperature:
                predictionPayload
                  .telemetry
                  .temperature,

              humidity:
                predictionPayload
                  .telemetry
                  .humidity,

              co2_ppm:
                predictionPayload
                  .telemetry
                  .co2_sim,

              raw_gas:
                predictionPayload
                  .telemetry
                  .gas_raw,
            },

            predicted_shelf_life_hours:
              Number(
                predJson
                  .mlPrediction
                  .predicted_shelf_life_hours
              ),

            predicted_shelf_life_days:
              Number(
                predJson
                  .mlPrediction
                  .predicted_shelf_life_days
              ),
          };
        }

        // -----------------------------------------------
        // CASE 2:
        // If API directly returns ML response
        // -----------------------------------------------

        else if (
          predJson.predicted_shelf_life_days !==
          undefined
        ) {
          finalPrediction =
            predJson;
        }

        // -----------------------------------------------
        // CASE 3:
        // Prediction inside prediction object
        // -----------------------------------------------

        else if (
          predJson.prediction
        ) {
          finalPrediction = {
            crop:
              predJson.prediction
                .crop ??
              predictionPayload.product,

            input_data: {
              crop:
                predictionPayload.product,

              temperature:
                predictionPayload
                  .telemetry
                  .temperature,

              humidity:
                predictionPayload
                  .telemetry
                  .humidity,

              co2_ppm:
                predictionPayload
                  .telemetry
                  .co2_sim,

              raw_gas:
                predictionPayload
                  .telemetry
                  .gas_raw,
            },

            predicted_shelf_life_hours:
              Number(
                predJson
                  .prediction
                  .predicted_shelf_life_hours ??
                  predJson
                    .prediction
                    .remainingShelfLifeHours
              ),

            predicted_shelf_life_days:
              Number(
                predJson
                  .prediction
                  .predicted_shelf_life_days ??
                  predJson
                    .prediction
                    .remainingShelfLifeDays
              ),
          };
        }

        // =================================================
        // 9. VERIFY PREDICTION
        // =================================================

        if (
          !finalPrediction ||
          !Number.isFinite(
            Number(
              finalPrediction
                .predicted_shelf_life_days
            )
          )
        ) {
          throw new Error(
            "Prediction response does not contain valid shelf-life data."
          );
        }

        // =================================================
        // 10. SAVE PREDICTION
        // =================================================

        setPrediction(
          finalPrediction
        );

        setPredictionError("");
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );

        if (!active) return;

        /*
          IMPORTANT:

          Do NOT mark the sensor disconnected
          when only prediction fails.
        */

        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch data";

        setPredictionError(
          message
        );
      } finally {
        if (active) {
          setLoading(false);
          setPredictionLoading(false);
        }
      }
    };

    // =================================================
    // INITIAL FETCH
    // =================================================

    fetchLatestData();

    // =================================================
    // REFRESH EVERY 10 SECONDS
    // =================================================

    const interval =
      setInterval(
        fetchLatestData,
        10000
      );

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = [
    ...sensorHistory,
  ]
    .reverse()
    .map((item, index) => {
      let time = `${index + 1}`;

      if (item.createdAt) {
        const date = new Date(
          item.createdAt
        );

        if (
          !isNaN(date.getTime())
        ) {
          time =
            date.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
        }
      }

      return {
        time,

        temperature:
          item.temperature,

        humidity:
          item.humidity,

        co2:
          item.co2,

        gas:
          item.gas,
      };
    });

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse">
            📊
          </div>

          <p className="mt-4 text-slate-400">
            Loading sensor data...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <div className="flex items-center justify-between">

            <div>
              <p className="mb-2 text-sm font-medium text-blue-400">
                SILOSENSE / MONITORING
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Crop Shelf-Life Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Live sensor monitoring and AI
                shelf-life prediction.
              </p>
            </div>

            {/* CONNECTION */}

            <div className="flex items-center gap-2">

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />

              <span
                className={`text-sm ${
                  isConnected
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {isConnected
                  ? "Connected"
                  : "Disconnected"}
              </span>

            </div>

          </div>
        </div>

        {/* =================================================
            SENSOR ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

            <p className="font-semibold text-red-400">
              Sensor Error
            </p>

            <p className="mt-1 text-sm text-red-300">
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            PREDICTION ERROR
        ================================================= */}

        {predictionError && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">

            <p className="font-semibold text-amber-400">
              AI Prediction Error
            </p>

            <p className="mt-1 text-sm text-amber-300">
              {predictionError}
            </p>

          </div>
        )}

        {/* =================================================
            SHELF LIFE PREDICTION
        ================================================= */}

        {prediction && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 to-slate-900 p-6">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              {/* CROP */}

              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Crop
                </p>

                <h2 className="mt-2 text-3xl font-bold capitalize">
                  🍎{" "}
                  {prediction.crop}
                </h2>
              </div>

              {/* SHELF LIFE */}

              <div className="text-left md:text-right">

                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Predicted Shelf Life
                </p>

                <div className="mt-1">

                  <span className="text-5xl font-bold text-emerald-400">
                    {Number(
                      prediction.predicted_shelf_life_days
                    ).toFixed(2)}
                  </span>

                  <span className="ml-2 text-lg text-slate-400">
                    days
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {Number(
                    prediction.predicted_shelf_life_hours
                  ).toFixed(2)}{" "}
                  hours
                </p>

              </div>

            </div>
          </section>
        )}

        {/* =================================================
            PREDICTION LOADING
        ================================================= */}

        {predictionLoading &&
          !prediction && (
            <div className="mb-8 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
              <p className="text-sm text-blue-300">
                🤖 Calculating AI shelf life...
              </p>
            </div>
          )}

        {/* =================================================
            CURRENT SENSOR VALUES
        ================================================= */}

        {sensorData && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <SensorCard
              title="Temperature"
              value={`${sensorData.temperature} °C`}
              icon="🌡️"
            />

            <SensorCard
              title="Humidity"
              value={`${sensorData.humidity} %`}
              icon="💧"
            />

            <SensorCard
              title="CO₂"
              value={`${sensorData.co2} ppm`}
              icon="🫧"
            />

            <SensorCard
              title="Raw Gas"
              value={sensorData.gas}
              icon="🧪"
            />

          </div>
        )}

        {/* =================================================
            LAST UPDATE
        ================================================= */}

        {lastUpdate && (
          <div className="mb-6 text-right">

            <span className="text-xs text-slate-500">
              Last sensor update:{" "}
            </span>

            <span className="font-mono text-xs text-slate-400">
              {lastUpdate.toLocaleString()}
            </span>

          </div>
        )}

        {/* =================================================
            GRAPHS
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* TEMPERATURE */}

          <ChartCard
            title="Temperature"
            description="Last 50 sensor readings"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
              >
                <defs>
                  <linearGradient
                    id="temperatureGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3b82f6"
                      stopOpacity={0.4}
                    />

                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#020617",
                    border:
                      "1px solid #1e293b",
                    borderRadius:
                      "10px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#3b82f6"
                  fill="url(#temperatureGradient)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* HUMIDITY */}

          <ChartCard
            title="Humidity"
            description="Last 50 sensor readings"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={chartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#020617",
                    border:
                      "1px solid #1e293b",
                    borderRadius:
                      "10px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="humidity"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* CO2 */}

          <ChartCard
            title="CO₂"
            description="Last 50 sensor readings"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#020617",
                    border:
                      "1px solid #1e293b",
                    borderRadius:
                      "10px",
                    color: "#fff",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* GAS */}

          <ChartCard
            title="Raw Gas"
            description="Last 50 sensor readings"
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={chartData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor:
                      "#020617",
                    border:
                      "1px solid #1e293b",
                    borderRadius:
                      "10px",
                    color: "#fff",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="gas"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* =================================================
            AI PREDICTION DETAILS
        ================================================= */}

        {prediction && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <h3 className="text-lg font-semibold">
              AI Prediction Details
            </h3>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* INPUT DATA */}

              <div className="rounded-xl bg-slate-950 p-5">

                <p className="mb-4 text-sm font-medium text-slate-400">
                  Input Data
                </p>

                <div className="space-y-3 text-sm">

                  <DataRow
                    label="Crop"
                    value={
                      prediction
                        .input_data
                        ?.crop
                    }
                  />

                  <DataRow
                    label="Temperature"
                    value={`${prediction.input_data?.temperature} °C`}
                  />

                  <DataRow
                    label="Humidity"
                    value={`${prediction.input_data?.humidity} %`}
                  />

                  <DataRow
                    label="CO₂"
                    value={`${prediction.input_data?.co2_ppm} ppm`}
                  />

                  <DataRow
                    label="Raw Gas"
                    value={
                      prediction
                        .input_data
                        ?.raw_gas
                    }
                  />

                </div>
              </div>

              {/* PREDICTION */}

              <div className="rounded-xl bg-slate-950 p-5">

                <p className="mb-4 text-sm font-medium text-slate-400">
                  Prediction
                </p>

                <div className="space-y-3 text-sm">

                  <DataRow
                    label="Shelf Life"
                    value={`${Number(
                      prediction.predicted_shelf_life_days
                    ).toFixed(2)} days`}
                  />

                  <DataRow
                    label="Shelf Life"
                    value={`${Number(
                      prediction.predicted_shelf_life_hours
                    ).toFixed(2)} hours`}
                  />

                </div>
              </div>

            </div>
          </section>
        )}

      </div>
    </main>
  );
}

// =====================================================
// SENSOR CARD
// =====================================================

function SensorCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-500">
          {title}
        </p>

        <span className="text-xl">
          {icon}
        </span>

      </div>

      <p className="mt-4 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}

// =====================================================
// DATA ROW
// =====================================================

function DataRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">

      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-medium text-white">
        {value ?? "—"}
      </span>

    </div>
  );
}

// =====================================================
// CHART CARD
// =====================================================

function ChartCard({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

      <div className="mb-5">

        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>

      </div>

      <div className="h-[320px]">
        {children}
      </div>

    </section>
  );
}
