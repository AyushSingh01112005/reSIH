"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const SensorGraphs = ({ records = [] }) => {
  const graphData = records
    .slice()
    .reverse()
    .map((record, index) => ({
      time: record.createdAt
        ? new Date(record.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : `Reading ${index + 1}`,

      temperature: Number(record.temperature) || 0,
      humidity: Number(record.humidity) || 0,
      co2: Number(record.co2) || 0,
      gas: Number(record.gas) || 0,
    }));

  console.log("GRAPH RECORDS:", records);
  console.log("GRAPH DATA:", graphData);

  if (!graphData.length) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
        No sensor records available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* Temperature */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h3 className="mb-1 text-lg font-semibold">
          🌡️ Temperature
        </h3>

        <p className="mb-6 text-sm text-slate-500">
          Last {graphData.length} sensor readings
        </p>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={graphData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
                unit="°C"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* Humidity */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h3 className="mb-1 text-lg font-semibold">
          💧 Humidity
        </h3>

        <p className="mb-6 text-sm text-slate-500">
          Last {graphData.length} sensor readings
        </p>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={graphData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
                unit="%"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* CO2 */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h3 className="mb-1 text-lg font-semibold">
          🌫️ CO₂
        </h3>

        <p className="mb-6 text-sm text-slate-500">
          Last {graphData.length} sensor readings
        </p>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={graphData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
                unit=" ppm"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="co2"
                name="CO₂"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* Gas */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h3 className="mb-1 text-lg font-semibold">
          🫧 Gas / Air Quality
        </h3>

        <p className="mb-6 text-sm text-slate-500">
          Last {graphData.length} sensor readings
        </p>

        <div className="h-[300px]">

          <ResponsiveContainer width="100%" height="100%">

            <LineChart data={graphData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="gas"
                name="Gas"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
};

export default SensorGraphs;