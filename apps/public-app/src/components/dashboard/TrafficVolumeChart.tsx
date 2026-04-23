"use client";

// TODO: Replace trafficVolumeData with:
// const data = await fetch('/api/analytics/volume?range=60m') via B4 Kong
// Historical data from B2 PostgreSQL

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TRAFFIC_SAMPLES } from "@/lib/dummy-data";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-2xl"
      style={{
        background: "#22263A",
        border: "1px solid rgba(255,255,255,0.10)",
        fontFamily: "var(--font-inter)",
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: "#ffffff" }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

export function TrafficVolumeChart() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mb-4">
        <h2
          className="text-[17px] font-semibold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Traffic Volume — 24h
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#757780" }}>
          Hourly vehicle count &amp; average speed
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={TRAFFIC_SAMPLES}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#757780", fontFamily: "var(--font-inter)" }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            yAxisId="volume"
            tick={{ fontSize: 10, fill: "#757780", fontFamily: "var(--font-inter)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="speed"
            orientation="right"
            tick={{ fontSize: 10, fill: "#757780", fontFamily: "var(--font-inter)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#757780", paddingTop: 12, fontFamily: "var(--font-inter)" }}
          />
          <Line
            yAxisId="volume"
            type="monotone"
            dataKey="volume"
            name="Volume"
            stroke="#4CD7F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#4CD7F6", strokeWidth: 0 }}
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="avgSpeed"
            name="Avg Speed (km/h)"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
