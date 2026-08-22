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
import SensorSocket from "@/components/SensorSocket";

const Page = () => {
  const [sensorData, setSensorData] = useState( {});

  const [sensorHistory, setSensorHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // --------------------------------------------------
  // SOCKET.IO SENSOR UPDATE
  // --------------------------------------------------

  const handleSensorUpdate = useCallback((data) => {
    console.log("Dashboard received:", data);

    const newReading = {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    setSensorData({
      deviceId: data.deviceId || "ESP32-001",
      temperature: Number(data.temperature) || 0,
      humidity: Number(data.humidity) || 0,
      gas: Number(data.gas) || 0,
      co2: Number(data.co2) || 0,
      motion: Boolean(data.motion),
    });

    setSensorHistory((prev) => {
      const updated = [newReading, ...prev].slice(0, 50);

      // Latest reading becomes current sensor data
      const latest = updated[0];

      if (latest) {
        setSensorData({
          deviceId: latest.deviceId || "ESP32-001",
          temperature: Number(latest.temperature) || 0,
          humidity: Number(latest.humidity) || 0,
          gas: Number(latest.gas) || 0,
          co2: Number(latest.co2) || 0,
          motion: Boolean(latest.motion),
        });
      }

      return updated;
    });

    setSensorHistory((prev) => {
      const updated = [newReading, ...prev];

      return updated.slice(0, 50);
    });

    setLastUpdate(new Date());
  }, []);

  const handleConnectionChange = useCallback((connected) => {
    setIsConnected(connected);
  }, []);

  // --------------------------------------------------
  // STATUS FUNCTIONS
  // --------------------------------------------------

  const getTemperatureStatus = () => {
    const temp = Number(sensorData.temperature);

    if (temp >= 2 && temp <= 8) {
      return "Normal";
    }

    return "Warning";
  };

  const getHumidityStatus = () => {
    const humidity = Number(sensorData.humidity);

    if (humidity <= 90) {
      return "Normal";
    }

    return "High";
  };

  const getCO2Status = () => {
    const co2 = Number(sensorData.co2);

    if (co2 < 1000) {
      return "Good";
    }

    return "High";
  };

  const getAirQualityStatus = () => {
    const gas = Number(sensorData.gas);

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

  // --------------------------------------------------
  // CHART DATA
  // --------------------------------------------------

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

          temperature: Number(reading.temperature) || 0,
          humidity: Number(reading.humidity) || 0,
          co2: Number(reading.co2) || 0,
          gas: Number(reading.gas) || 0,

          motion: reading.motion ? 1 : 0,
        };
      });
  }, [sensorHistory]);

  // --------------------------------------------------
  // ANALYTICS
  // --------------------------------------------------

  const analytics = useMemo(() => {
    if (!sensorHistory.length) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        maxTemperature: 0,
        minTemperature: 0,
        avgCO2: 0,
        motionEvents: 0,
      };
    }

    const temperatures = sensorHistory.map(
      (item) => Number(item.temperature) || 0
    );

    const humidities = sensorHistory.map(
      (item) => Number(item.humidity) || 0
    );

    const co2Values = sensorHistory.map(
      (item) => Number(item.co2) || 0
    );

    const motionEvents = sensorHistory.filter(
      (item) => item.motion === true
    ).length;
    console.log("SENSOR HISTORY:", sensorHistory);
    console.log("CHART DATA:", chartData);

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
    };
  }, [sensorHistory]);

  // --------------------------------------------------
  // SENSOR CARDS
  // --------------------------------------------------

  const sensors = [
    {
      name: "Temperature",
      value: `${sensorData.temperature}°C`,
      status: getTemperatureStatus(),
      icon: "🌡️",
      description: "Recommended 2°C – 8°C",
    },
    {
      name: "Humidity",
      value: `${sensorData.humidity}%`,
      status: getHumidityStatus(),
      icon: "💧",
      description: "Storage humidity",
    },
    {
      name: "CO₂ Level",
      value: `${sensorData.co2} ppm`,
      status: getCO2Status(),
      icon: "🌫️",
      description: "Carbon dioxide",
    },
    {
      name: "Air Quality",
      value: `${sensorData.gas}`,
      status: getAirQualityStatus(),
      icon: "🫧",
      description: "MQ135 gas sensor",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* ------------------------------------------------ */}
      {/* SOCKET */}
      {/* ------------------------------------------------ */}

      <SensorSocket
        onSensorUpdate={handleSensorUpdate}
        onConnectionChange={handleConnectionChange}
      />

      {/* Existing historical data loader */}
      <SensorHistory onData={setSensorHistory} />

      {/* ------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------ */}

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
              className={`flex items-center gap-2 rounded-full border px-4 py-2 ${isConnected
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-red-500/20 bg-red-500/10"
                }`}
            >

              <span
                className={`h-2 w-2 rounded-full ${isConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-red-400"
                  }`}
              />

              <span
                className={`text-xs font-medium ${isConnected
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

      {/* ------------------------------------------------ */}
      {/* MAIN */}
      {/* ------------------------------------------------ */}

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
                Monitor temperature, humidity, gas concentration,
                CO₂ and motion activity in real time.
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

        {/* ------------------------------------------------ */}
        {/* TOP STATUS CARDS */}
        {/* ------------------------------------------------ */}

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
                className={`text-2xl font-bold ${isConnected
                    ? "text-emerald-400"
                    : "text-red-400"
                  }`}
              >
                {isConnected ? "Online" : "Offline"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {sensorData.deviceId}
              </p>

            </div>

          </div>

          {/* HEALTH */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Storage Health
              </span>

              <span className="text-lg">
                ❤️
              </span>

            </div>

            <div className="mt-5">

              <div className="flex items-end justify-between">

                <p className="text-2xl font-bold text-emerald-400">
                  94%
                </p>

                <span className="text-xs text-emerald-400">
                  Excellent
                </span>

              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">

                <div className="h-full w-[94%] rounded-full bg-emerald-500" />

              </div>

            </div>

          </div>

          {/* RECORDS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Sensor Records
              </span>

              <span className="text-lg">
                📊
              </span>

            </div>

            <div className="mt-5">

              <p className="text-2xl font-bold">
                {sensorHistory.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Available readings
              </p>

            </div>

          </div>

          {/* MOTION */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Motion Events
              </span>

              <span className="text-lg">
                🚨
              </span>

            </div>

            <div className="mt-5">

              <p
                className={`text-2xl font-bold ${analytics.motionEvents > 0
                    ? "text-yellow-400"
                    : "text-emerald-400"
                  }`}
              >
                {analytics.motionEvents}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                In available records
              </p>

            </div>

          </div>

        </div>

        {/* ------------------------------------------------ */}
        {/* SENSOR CARDS */}
        {/* ------------------------------------------------ */}

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

        {/* ------------------------------------------------ */}
        {/* TEMPERATURE GRAPH */}
        {/* ------------------------------------------------ */}

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
                Temperature readings from the latest sensor records
              </p>

            </div>

            <div className="text-right">

              <p className="text-2xl font-bold">
                {sensorData.temperature}°C
              </p>

              <p className="text-xs text-slate-500">
                Current temperature
              </p>

            </div>

          </div>

          <div className="h-[320px] w-full">

            {chartData.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

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

                  {/* Recommended cold storage range */}

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

        {/* ------------------------------------------------ */}
        {/* HUMIDITY + CO2 */}
        {/* ------------------------------------------------ */}

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

                <ResponsiveContainer width="100%" height="100%">

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
                Carbon dioxide concentration
              </p>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

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

        {/* ------------------------------------------------ */}
        {/* GAS + MOTION */}
        {/* ------------------------------------------------ */}

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* GAS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

            <div className="mb-6">

              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🫧
                </span>

                <h3 className="font-semibold">
                  Air Quality / Gas
                </h3>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                MQ135 sensor readings
              </p>

            </div>

            <div className="h-[280px]">

              {chartData.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

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

                <ResponsiveContainer width="100%" height="100%">

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
                        value === 1 ? "Motion" : "None"
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
                        value === 1
                          ? ["Motion detected", "Status"]
                          : ["No motion", "Status"]
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

        {/* ------------------------------------------------ */}
        {/* ANALYTICS */}
        {/* ------------------------------------------------ */}

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

        {/* ------------------------------------------------ */}
        {/* CURRENT READING */}
        {/* ------------------------------------------------ */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="mb-5">

            <h3 className="font-semibold">
              Current Reading
            </h3>

            <p className="text-sm text-slate-500">
              Latest values received from ESP32
            </p>

          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">

            <CurrentValue
              label="Device"
              value={sensorData.deviceId}
            />

            <CurrentValue
              label="Temperature"
              value={`${sensorData.temperature}°C`}
            />

            <CurrentValue
              label="Humidity"
              value={`${sensorData.humidity}%`}
            />

            <CurrentValue
              label="CO₂"
              value={`${sensorData.co2} ppm`}
            />

            <CurrentValue
              label="Gas"
              value={sensorData.gas}
            />

          </div>

        </section>

        {/* ------------------------------------------------ */}
        {/* SENSOR HISTORY TABLE */}
        {/* ------------------------------------------------ */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div>

              <h3 className="font-semibold">
                Sensor History
              </h3>

              <p className="text-sm text-slate-500">
                Latest sensor records received from the system
              </p>

            </div>

            <span className="w-fit rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
              {sensorHistory.length} Records
            </span>

          </div>

          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[850px] text-left text-sm">

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
                    Gas
                  </th>

                  <th className="px-4 py-3">
                    Motion
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
                      colSpan={7}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      No sensor records available
                    </td>

                  </tr>

                ) : (

                  sensorHistory.map((reading, index) => (

                    <tr
                      key={reading._id || index}
                      className="border-b border-slate-800/70 transition hover:bg-slate-950"
                    >

                      <td className="px-4 py-4 font-medium">
                        {reading.deviceId || "ESP32-001"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-blue-400">
                          {reading.temperature}°C
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-cyan-400">
                          {reading.humidity}%
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-purple-400">
                          {reading.co2} ppm
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {reading.gas}
                      </td>

                      <td className="px-4 py-4">

                        {reading.motion ? (

                          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400">
                            🚨 Detected
                          </span>

                        ) : (

                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                            No Motion
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
                          })
                          : "--:--"}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ------------------------------------------------ */}
        {/* STORAGE */}
        {/* ------------------------------------------------ */}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">

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
                value={isConnected ? "Socket.IO Live" : "Disconnected"}
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

// --------------------------------------------------
// COMPONENTS
// --------------------------------------------------

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

export default Page;