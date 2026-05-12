"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CameraChartSample } from "@/lib/backend-api";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
      <p className="font-semibold mb-1.5" style={{ color: "#ffffff" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

interface TrafficVolumeChartProps {
  samples: CameraChartSample[];
}

export function TrafficVolumeChart({ samples }: TrafficVolumeChartProps) {
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
          Live Camera Traffic
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#757780" }}>
          Current vehicle count &amp; average speed per camera
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart
          data={samples}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#757780", fontFamily: "var(--font-inter)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="count"
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
            wrapperStyle={{
              fontSize: 11,
              color: "#757780",
              paddingTop: 12,
              fontFamily: "var(--font-inter)",
            }}
          />
          <Bar
            yAxisId="count"
            dataKey="vehicleCount"
            name="Vehicle Count"
            fill="#4CD7F6"
            fillOpacity={0.8}
            radius={[3, 3, 0, 0]}
          />
          <Line
            yAxisId="speed"
            type="monotone"
            dataKey="avgSpeed"
            name="Avg Speed (km/h)"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#3B82F6", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
