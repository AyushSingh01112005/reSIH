"use client";

import { useCallback, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

import SensorHistory from "@/components/SensorHistory";

const Page = () => {
  const [sensorData, setSensorData] = useState({
    deviceId: "ESP8266-001",

    telemetry: {
      temperature: 0,
      humidity: 0,
      gas_raw: 0,
      co2_sim: 0,
    },

    triggers: {
      alcohol_detected: false,
      motion_detected: false,
      sound_detected: false,
      tamper_light: false,
    },

    status: {
      http_response: 0,
      uptime_sec: 0,
      wifi_connected: false,
    },

    createdAt: null,
    updatedAt: null,
    timestamp_ms: 0,
  });

  const [sensorHistory, setSensorHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // =====================================================
  // NORMALIZE SENSOR DATA
  // =====================================================

  const normalizeReading = useCallback((data) => {
    return {
      ...data,

      deviceId: data.deviceId || "ESP8266-001",

      telemetry: {
        temperature:
          Number(data.telemetry?.temperature ?? data.temperature) || 0,

        humidity:
          Number(data.telemetry?.humidity ?? data.humidity) || 0,

        gas_raw:
          Number(data.telemetry?.gas_raw ?? data.gas) || 0,

        co2_sim:
          Number(data.telemetry?.co2_sim ?? data.co2) || 0,
      },

      triggers: {
        alcohol_detected: Boolean(
          data.triggers?.alcohol_detected ?? data.alcohol_detected
        ),

        motion_detected: Boolean(
          data.triggers?.motion_detected ?? data.motion
        ),

        sound_detected: Boolean(
          data.triggers?.sound_detected ?? data.sound_detected
        ),

        tamper_light: Boolean(
          data.triggers?.tamper_light ?? data.tamper_light
        ),
      },

      status: {
        http_response:
          Number(data.status?.http_response) || 0,

        uptime_sec:
          Number(data.status?.uptime_sec) || 0,

        wifi_connected:
          Boolean(data.status?.wifi_connected),
      },

      createdAt:
        data.createdAt ||
        data.updatedAt ||
        new Date().toISOString(),

      updatedAt:
        data.updatedAt ||
        data.createdAt ||
        new Date().toISOString(),

      timestamp_ms:
        Number(data.timestamp_ms) || 0,
    };
  }, []);

  // =====================================================
  // SOCKET.IO SENSOR UPDATE
  // =====================================================

  const handleSensorUpdate = useCallback(
    (data) => {
      console.log("Dashboard received:", data);

      const newReading = normalizeReading(data);

      console.log("Normalized reading:", newReading);

      // Update current reading
      setSensorData(newReading);

      // Add ONLY ONCE to history
      setSensorHistory((prev) => {
        return [newReading, ...prev].slice(0, 50);
      });

      setLastUpdate(
        new Date(
          newReading.createdAt || new Date().toISOString()
        )
      );
    },
    [normalizeReading]
  );

  // =====================================================
  // HISTORICAL DATA
  // =====================================================

  const handleHistoricalData = useCallback(
    (data) => {
      if (!Array.isArray(data)) {
        console.warn("Historical sensor data is not an array:", data);
        return;
      }

      const normalized = data.map(normalizeReading);

      setSensorHistory(normalized.slice(0, 50));

      if (normalized.length > 0) {
        const latest = normalized[0];

        setSensorData(latest);

        setLastUpdate(
          new Date(
            latest.createdAt || new Date().toISOString()
          )
        );
      }
    },
    [normalizeReading]
  );

  // =====================================================
  // CONNECTION
  // =====================================================

  const handleConnectionChange = useCallback((connected) => {
    setIsConnected(connected);
  }, []);

  // =====================================================
  // CURRENT VALUES
  // =====================================================

  const temperature = Number(
    sensorData.telemetry?.temperature
  ) || 0;

  const humidity = Number(
    sensorData.telemetry?.humidity
  ) || 0;

  const gas = Number(
    sensorData.telemetry?.gas_raw
  ) || 0;

  const co2 = Number(
    sensorData.telemetry?.co2_sim
  ) || 0;

  const motionDetected = Boolean(
    sensorData.triggers?.motion_detected
  );

  const soundDetected = Boolean(
    sensorData.triggers?.sound_detected
  );

  const alcoholDetected = Boolean(
    sensorData.triggers?.alcohol_detected
  );

  const tamperDetected = Boolean(
    sensorData.triggers?.tamper_light
  );

  const wifiConnected = Boolean(
    sensorData.status?.wifi_connected
  );

  const httpResponse = Number(
    sensorData.status?.http_response
  ) || 0;

  const uptimeSeconds = Number(
    sensorData.status?.uptime_sec
  ) || 0;

  // =====================================================
  // STATUS FUNCTIONS
  // =====================================================

  const getTemperatureStatus = () => {
    if (temperature >= 2 && temperature <= 8) {
      return "Normal";
    }

    return "Warning";
  };

  const getHumidityStatus = () => {
    if (humidity <= 90) {
      return "Normal";
    }

    return "High";
  };

  const getCO2Status = () => {
    if (co2 < 1000) {
      return "Good";
    }

    return "High";
  };

  const getAirQualityStatus = () => {
    if (gas < 300) {
      return "Good";
    }

    return "Poor";
  };

  const getStatusClass = (status) => {
    if (status === "Normal" || status === "Good") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    if (status === "Warning" || status === "High") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatLastUpdate = () => {
    if (!lastUpdate) {
      return "--:--";
    }

    return lastUpdate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatUptime = (seconds) => {
    if (!seconds || seconds < 0) {
      return "0s";
    }

    const days = Math.floor(seconds / 86400);

    const hours = Math.floor(
      (seconds % 86400) / 3600
    );

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }

    return `${secs}s`;
  };

  // =====================================================
  // CHART DATA
  // =====================================================

  const chartData = useMemo(() => {
    return [...sensorHistory]
      .reverse()
      .map((reading, index) => {
        const date = reading.createdAt
          ? new Date(reading.createdAt)
          : new Date();

        return {
          index,

          time: date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),

          temperature:
            Number(
              reading.telemetry?.temperature ??
              reading.temperature
            ) || 0,

          humidity:
            Number(
              reading.telemetry?.humidity ??
              reading.humidity
            ) || 0,

          co2:
            Number(
              reading.telemetry?.co2_sim ??
              reading.co2
            ) || 0,

          gas:
            Number(
              reading.telemetry?.gas_raw ??
              reading.gas
            ) || 0,

          motion: reading.triggers?.motion_detected
            ? 1
            : reading.motion
              ? 1
              : 0,

          sound: reading.triggers?.sound_detected ? 1 : 0,

          alcohol: reading.triggers?.alcohol_detected
            ? 1
            : 0,

          tamper: reading.triggers?.tamper_light
            ? 1
            : 0,
        };
      });
  }, [sensorHistory]);

  // =====================================================
  // ANALYTICS
  // =====================================================

  const analytics = useMemo(() => {
    if (!sensorHistory.length) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        maxTemperature: 0,
        minTemperature: 0,
        avgCO2: 0,
        motionEvents: 0,
        soundEvents: 0,
        alcoholEvents: 0,
        tamperEvents: 0,
      };
    }

    const temperatures = sensorHistory.map(
      (item) =>
        Number(
          item.telemetry?.temperature ??
          item.temperature
        ) || 0
    );

    const humidities = sensorHistory.map(
      (item) =>
        Number(
          item.telemetry?.humidity ??
          item.humidity
        ) || 0
    );

    const co2Values = sensorHistory.map(
      (item) =>
        Number(
          item.telemetry?.co2_sim ??
          item.co2
        ) || 0
    );

    const motionEvents = sensorHistory.filter(
      (item) =>
        item.triggers?.motion_detected ??
        item.motion === true
    ).length;

    const soundEvents = sensorHistory.filter(
      (item) =>
        item.triggers?.sound_detected === true
    ).length;

    const alcoholEvents = sensorHistory.filter(
      (item) =>
        item.triggers?.alcohol_detected === true
    ).length;

    const tamperEvents = sensorHistory.filter(
      (item) =>
        item.triggers?.tamper_light === true
    ).length;

    return {
      avgTemperature:
        temperatures.reduce((a, b) => a + b, 0) /
        temperatures.length,

      avgHumidity:
        humidities.reduce((a, b) => a + b, 0) /
        humidities.length,

      maxTemperature: Math.max(...temperatures),

      minTemperature: Math.min(...temperatures),

      avgCO2:
        co2Values.reduce((a, b) => a + b, 0) /
        co2Values.length,

      motionEvents,
      soundEvents,
      alcoholEvents,
      tamperEvents,
    };
  }, [sensorHistory]);

  // =====================================================
  // SENSOR CARDS
  // =====================================================

  const sensors = [
    {
      name: "Temperature",
      value: `${temperature}°C`,
      status: getTemperatureStatus(),
      icon: "🌡️",
      description: "Recommended 2°C – 8°C",
    },

    {
      name: "Humidity",
      value: `${humidity}%`,
      status: getHumidityStatus(),
      icon: "💧",
      description: "Storage humidity",
    },

    {
      name: "CO₂ Level",
      value: `${co2} ppm`,
      status: getCO2Status(),
      icon: "🌫️",
      description: "Simulated CO₂",
    },

    {
      name: "Gas Level",
      value: `${gas}`,
      status: getAirQualityStatus(),
      icon: "🫧",
      description: "MQ135 raw reading",
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-[#020617] text-white">



      {/* HISTORICAL DATA */}

      <SensorHistory
        onData={handleHistoricalData}
      />

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                ❄️
              </div>

              <h1 className="text-xl font-bold tracking-tight">
                SILO<span className="text-blue-500">SENSE</span>
              </h1>

            </div>

            <p className="mt-1 text-xs text-slate-500">
              Smart Cold Storage Monitoring System
            </p>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">

              <p className="text-xs text-slate-500">
                Device
              </p>

              <p className="text-sm font-medium">
                {sensorData.deviceId}
              </p>

            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
                isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-red-500/20 bg-red-500/10"
              }`}
            >

              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />

              <span
                className={`text-xs font-medium ${
                  isConnected
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {isConnected ? "Live" : "Offline"}
              </span>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* TITLE */}

        <div className="mb-8">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="mb-2 text-sm font-medium text-blue-400">
                COLD STORAGE / MONITORING
              </p>

              <h2 className="text-3xl font-bold tracking-tight">
                Environmental Dashboard
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Monitor temperature, humidity, gas,
                CO₂, motion, sound, alcohol and tamper
                activity in real time.
              </p>

            </div>

            <div className="text-left md:text-right">

              <p className="text-xs text-slate-500">
                Last sensor update
              </p>

              <p className="mt-1 font-mono text-sm text-slate-300">
                {formatLastUpdate()}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TOP STATUS CARDS */}
        {/* ================================================= */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* DEVICE */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Device Status
              </span>

              <span className="text-lg">
                📡
              </span>

            </div>

            <div className="mt-5">

              <p
                className={`text-2xl font-bold ${
                  wifiConnected && isConnected
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {wifiConnected && isConnected
                  ? "Online"
                  : "Offline"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {sensorData.deviceId}
              </p>

            </div>

          </div>

          {/* WIFI */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                WiFi
              </span>

              <span className="text-lg">
                📶
              </span>

            </div>

            <div className="mt-5">

              <p
                className={`text-2xl font-bold ${
                  wifiConnected
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {wifiConnected ? "Connected" : "Disconnected"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                ESP8266 network status
              </p>

            </div>

          </div>

          {/* UPTIME */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Device Uptime
              </span>

              <span className="text-lg">
                ⏱️
              </span>

            </div>

            <div className="mt-5">

              <p className="text-2xl font-bold">
                {formatUptime(uptimeSeconds)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {uptimeSeconds.toLocaleString()} seconds
              </p>

            </div>

          </div>

          {/* ALERTS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Active Triggers
              </span>

              <span className="text-lg">
                🚨
              </span>

            </div>

            <div className="mt-5">

              <p
                className={`text-2xl font-bold ${
                  motionDetected ||
                  soundDetected ||
                  alcoholDetected ||
                  tamperDetected
                    ? "text-yellow-400"
                    : "text-emerald-400"
                }`}
              >
                {
                  [
                    motionDetected,
                    soundDetected,
                    alcoholDetected,
                    tamperDetected,
                  ].filter(Boolean).length
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Current sensor triggers
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* SENSOR CARDS */}
        {/* ================================================= */}

        <section className="mb-8">

          <div className="mb-4">

            <h3 className="text-lg font-semibold">
              Live Sensor Readings
            </h3>

            <p className="text-sm text-slate-500">
              Current environmental conditions
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {sensors.map((sensor) => (

              <div
                key={sensor.name}
                className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:-translate-y-1 hover:border-slate-700"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    {sensor.icon}
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClass(
                      sensor.status
                    )}`}
                  >
                    {sensor.status}
                  </span>

                </div>

                <p className="mt-5 text-sm text-slate-500">
                  {sensor.name}
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {sensor.value}
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  {sensor.description}
                </p>

              </div>

            ))}

          </div>

        </section>

        {/* ================================================= */}
        {/* TEMPERATURE */}
        {/* ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

            <div>

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🌡️
                </span>

                <h3 className="font-semibold">
                  Temperature History
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Temperature readings from ESP8266
              </p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold">
                {temperature}°C
              </p>

              <p className="text-xs text-slate-500">
                Current temperature
              </p>

            </div>

          </div>

          <div className="h-[320px] w-full">

            {chartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart data={chartData}>

                  <defs>

                    <linearGradient
                      id="temperatureGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="5%"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
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
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    unit="°C"
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />

                  <ReferenceLine
                    y={8}
                    stroke="#facc15"
                    strokeDasharray="5 5"
                    label={{
                      value: "Max 8°C",
                      fill: "#facc15",
                      fontSize: 11,
                    }}
                  />

                  <ReferenceLine
                    y={2}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    label={{
                      value: "Min 2°C",
                      fill: "#22c55e",
                      fontSize: 11,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#temperatureGradient)"
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                </AreaChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart message="Waiting for temperature records..." />

            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* HUMIDITY + CO2 */}
        {/* ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* HUMIDITY */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="mb-6">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  💧
                </span>

                <h3 className="font-semibold">
                  Humidity History
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Relative humidity over time
              </p>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      unit="%"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                    />

                    <ReferenceLine
                      y={90}
                      stroke="#facc15"
                      strokeDasharray="5 5"
                      label={{
                        value: "90%",
                        fill: "#facc15",
                        fontSize: 10,
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <EmptyChart message="Waiting for humidity records..." />

              )}

            </div>

          </div>

          {/* CO2 */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="mb-6">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🌫️
                </span>

                <h3 className="font-semibold">
                  CO₂ History
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Simulated carbon dioxide concentration
              </p>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      unit=" ppm"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                    />

                    <ReferenceLine
                      y={1000}
                      stroke="#facc15"
                      strokeDasharray="5 5"
                    />

                    <Line
                      type="monotone"
                      dataKey="co2"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <EmptyChart message="Waiting for CO₂ records..." />

              )}

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* GAS + MOTION */}
        {/* ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* GAS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="mb-6">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🫧
                </span>

                <h3 className="font-semibold">
                  Gas / Air Quality
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                MQ135 raw sensor readings
              </p>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                    />

                    <Bar
                      dataKey="gas"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <EmptyChart message="Waiting for gas records..." />

              )}

            </div>

          </div>

          {/* MOTION */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="mb-6 flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <span className="text-xl">
                    🚨
                  </span>

                  <h3 className="font-semibold">
                    Motion Activity
                  </h3>

                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Movement detected by the device
                </p>

              </div>

              <div className="text-right">

                <p className="text-2xl font-bold">
                  {analytics.motionEvents}
                </p>

                <p className="text-xs text-slate-500">
                  events
                </p>

              </div>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <YAxis
                      domain={[0, 1]}
                      ticks={[0, 1]}
                      tickFormatter={(value) =>
                        value === 1
                          ? "Motion"
                          : "None"
                      }
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        border: "1px solid #1e293b",
                        borderRadius: "12px",
                      }}
                      formatter={(value) =>
                        Number(value) === 1
                          ? [
                              "Motion detected",
                              "Status",
                            ]
                          : [
                              "No motion",
                              "Status",
                            ]
                      }
                    />

                    <Bar
                      dataKey="motion"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <EmptyChart message="Waiting for motion records..." />

              )}

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TRIGGERS */}
        {/* ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="mb-5">

            <h3 className="font-semibold">
              Security & Trigger Status
            </h3>

            <p className="text-sm text-slate-500">
              Current trigger signals received from ESP8266
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <TriggerCard
              title="Motion"
              value={motionDetected}
              icon="🚶"
            />

            <TriggerCard
              title="Sound"
              value={soundDetected}
              icon="🔊"
            />

            <TriggerCard
              title="Alcohol / Gas"
              value={alcoholDetected}
              icon="🧪"
            />

            <TriggerCard
              title="Tamper / Light"
              value={tamperDetected}
              icon="💡"
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* ANALYTICS */}
        {/* ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="mb-5">

            <h3 className="font-semibold">
              Sensor Analytics
            </h3>

            <p className="text-sm text-slate-500">
              Calculated from available sensor records
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

            <AnalyticsCard
              title="Avg Temperature"
              value={`${analytics.avgTemperature.toFixed(1)}°C`}
              icon="🌡️"
            />

            <AnalyticsCard
              title="Min Temperature"
              value={`${analytics.minTemperature.toFixed(1)}°C`}
              icon="❄️"
            />

            <AnalyticsCard
              title="Max Temperature"
              value={`${analytics.maxTemperature.toFixed(1)}°C`}
              icon="🔥"
            />

            <AnalyticsCard
              title="Avg Humidity"
              value={`${analytics.avgHumidity.toFixed(1)}%`}
              icon="💧"
            />

            <AnalyticsCard
              title="Avg CO₂"
              value={`${analytics.avgCO2.toFixed(0)} ppm`}
              icon="🌫️"
            />

            <AnalyticsCard
              title="Motion Events"
              value={analytics.motionEvents}
              icon="🚨"
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* CURRENT READING */}
        {/* ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="mb-5">

            <h3 className="font-semibold">
              Current Reading
            </h3>

            <p className="text-sm text-slate-500">
              Latest values received from ESP8266
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">

            <CurrentValue
              label="Device"
              value={sensorData.deviceId}
            />

            <CurrentValue
              label="Temperature"
              value={`${temperature}°C`}
            />

            <CurrentValue
              label="Humidity"
              value={`${humidity}%`}
            />

            <CurrentValue
              label="CO₂"
              value={`${co2} ppm`}
            />

            <CurrentValue
              label="Gas Raw"
              value={gas}
            />

            <CurrentValue
              label="HTTP"
              value={httpResponse}
            />

            <CurrentValue
              label="Uptime"
              value={formatUptime(uptimeSeconds)}
            />

          </div>

        </section>

        {/* ================================================= */}
        {/* SENSOR HISTORY TABLE */}
        {/* ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>

              <h3 className="font-semibold">
                Sensor History
              </h3>

              <p className="text-sm text-slate-500">
                Latest ESP8266 sensor records
              </p>

            </div>

            <span className="w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
              {sensorHistory.length} Records
            </span>

          </div>

          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead>

                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">

                  <th className="px-4 py-3">
                    Device
                  </th>

                  <th className="px-4 py-3">
                    Temperature
                  </th>

                  <th className="px-4 py-3">
                    Humidity
                  </th>

                  <th className="px-4 py-3">
                    CO₂
                  </th>

                  <th className="px-4 py-3">
                    Gas Raw
                  </th>

                  <th className="px-4 py-3">
                    Motion
                  </th>

                  <th className="px-4 py-3">
                    Sound
                  </th>

                  <th className="px-4 py-3">
                    Alcohol
                  </th>

                  <th className="px-4 py-3">
                    Tamper
                  </th>

                  <th className="px-4 py-3">
                    WiFi
                  </th>

                  <th className="px-4 py-3">
                    Time
                  </th>

                </tr>

              </thead>

              <tbody>

                {sensorHistory.length === 0 ? (

                  <tr>

                    <td
                      colSpan={11}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No sensor records available
                    </td>

                  </tr>

                ) : (

                  sensorHistory.map((reading, index) => {

                    const rowTemperature =
                      Number(
                        reading.telemetry?.temperature
                      ) || 0;

                    const rowHumidity =
                      Number(
                        reading.telemetry?.humidity
                      ) || 0;

                    const rowCO2 =
                      Number(
                        reading.telemetry?.co2_sim
                      ) || 0;

                    const rowGas =
                      Number(
                        reading.telemetry?.gas_raw
                      ) || 0;

                    const rowMotion =
                      Boolean(
                        reading.triggers?.motion_detected
                      );

                    const rowSound =
                      Boolean(
                        reading.triggers?.sound_detected
                      );

                    const rowAlcohol =
                      Boolean(
                        reading.triggers?.alcohol_detected
                      );

                    const rowTamper =
                      Boolean(
                        reading.triggers?.tamper_light
                      );

                    return (
                      <tr
                        key={
                          reading._id ||
                          `${reading.createdAt}-${index}`
                        }
                        className="border-b border-slate-800/70 transition hover:bg-slate-950"
                      >

                        <td className="px-4 py-4 font-medium">
                          {reading.deviceId ||
                            "ESP8266-001"}
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-blue-400">
                            {rowTemperature}°C
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-cyan-400">
                            {rowHumidity}%
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="text-purple-400">
                            {rowCO2} ppm
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {rowGas}
                        </td>

                        <td className="px-4 py-4">
                          <TriggerBadge
                            active={rowMotion}
                            activeText="Detected"
                            inactiveText="None"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <TriggerBadge
                            active={rowSound}
                            activeText="Detected"
                            inactiveText="None"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <TriggerBadge
                            active={rowAlcohol}
                            activeText="Detected"
                            inactiveText="None"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <TriggerBadge
                            active={rowTamper}
                            activeText="Detected"
                            inactiveText="Normal"
                          />
                        </td>

                        <td className="px-4 py-4">

                          {reading.status?.wifi_connected ? (

                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                              Connected
                            </span>

                          ) : (

                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                              Offline
                            </span>

                          )}

                        </td>

                        <td className="px-4 py-4 text-slate-500">

                          {reading.createdAt
                            ? new Date(
                                reading.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "--:--"}

                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================================================= */}
        {/* STORAGE + SYSTEM */}
        {/* ================================================= */}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* STORAGE */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <h3 className="font-semibold">
              Storage Information
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-4">

              <StorageItem
                title="Stored Produce"
                value="Potatoes"
              />

              <StorageItem
                title="Quantity"
                value="42.5 Tons"
              />

              <StorageItem
                title="Storage Capacity"
                value="78%"
              />

              <StorageItem
                title="Shelf Life"
                value="24 Days"
              />

            </div>

          </div>

          {/* SYSTEM */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <h3 className="font-semibold">
              System Information
            </h3>

            <div className="mt-5 space-y-4">

              <InfoRow
                label="Device"
                value={sensorData.deviceId}
              />

              <InfoRow
                label="Connection"
                value={
                  isConnected
                    ? "Socket.IO Live"
                    : "Disconnected"
                }
              />

              <InfoRow
                label="WiFi"
                value={
                  wifiConnected
                    ? "Connected"
                    : "Disconnected"
                }
              />

              <InfoRow
                label="HTTP Response"
                value={httpResponse}
              />

              <InfoRow
                label="Uptime"
                value={formatUptime(uptimeSeconds)}
              />

              <InfoRow
                label="Timestamp"
                value={
                  sensorData.timestamp_ms
                    ? `${sensorData.timestamp_ms} ms`
                    : "N/A"
                }
              />

              <InfoRow
                label="Records"
                value={`${sensorHistory.length} readings`}
              />

              <InfoRow
                label="Last Update"
                value={formatLastUpdate()}
              />

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

// =====================================================
// COMPONENTS
// =====================================================

function EmptyChart({ message }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50">

      <div className="text-center">

        <div className="text-3xl">
          📊
        </div>

        <p className="mt-3 text-sm text-slate-500">
          {message}
        </p>

      </div>

    </div>
  );
}

function AnalyticsCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs text-slate-500">
          {title}
        </p>

        <span>
          {icon}
        </span>

      </div>

      <p className="mt-3 text-lg font-bold">
        {value}
      </p>

    </div>
  );
}

function CurrentValue({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-950 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate font-semibold">
        {value}
      </p>

    </div>
  );
}

function StorageItem({ title, value }) {
  return (
    <div className="rounded-xl bg-slate-950 p-4">

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-2 font-semibold">
        {value}
      </p>

    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium">
        {value}
      </span>

    </div>
  );
}

function TriggerCard({ title, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {title}
        </p>

        <span className="text-lg">
          {icon}
        </span>

      </div>

      <p
        className={`mt-4 text-xl font-bold ${
          value
            ? "text-yellow-400"
            : "text-emerald-400"
        }`}
      >
        {value ? "Detected" : "Normal"}
      </p>

    </div>
  );
}

function TriggerBadge({
  active,
  activeText,
  inactiveText,
}) {
  return active ? (
    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
      🚨 {activeText}
    </span>
  ) : (
    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
      ✓ {inactiveText}
    </span>
  );
}

export default Page;