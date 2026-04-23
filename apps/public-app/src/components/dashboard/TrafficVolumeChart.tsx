"use client";

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
    <div className="rounded-lg bg-zinc-900 ring-1 ring-zinc-700 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-zinc-300 mb-1">{label}</p>
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
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Traffic Volume (24h)</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Hourly vehicle count & average speed
        </p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={TRAFFIC_SAMPLES}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            yAxisId="volume"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="speed"
            orientation="right"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#a1a1aa", paddingTop: 8 }}
          />
          <Line
            yAxisId="volume"
            type="monotone"
            dataKey="volume"
            name="Volume"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#22d3ee" }}
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="avgSpeed"
            name="Avg Speed (km/h)"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#a78bfa" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
