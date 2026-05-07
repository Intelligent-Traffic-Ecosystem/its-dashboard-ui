"use client";

import { useCurrentCongestion, useDashboardSummary } from "@/lib/hooks/useB3Backend";

function minutesSince(timestamp?: string) {
  if (!timestamp) return null;
  const age = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(age)) return null;
  return Math.max(0, Math.round(age / 60000));
}

export default function TelemetryHUD() {
  const { data: summary } = useDashboardSummary();
  const { data: metrics } = useCurrentCongestion();
  const latestMetric = metrics
    ?.map((metric) => metric.windowEnd)
    .filter(Boolean)
    .sort()
    .at(-1);
  const lastUpdatedMinutes = minutesSince(summary?.lastUpdated ?? summary?.last_updated ?? latestMetric ?? undefined);

  const stats = [
    {
      label: "Avg System Speed",
      value: summary ? summary.avg_speed_kmh.toFixed(1) : "—",
      unit: "km/h",
      valueClass: "text-primary",
      extra: "",
    },
    {
      label: "Active Units",
      value: metrics ? metrics.length.toLocaleString() : "—",
      unit: "",
      valueClass: "text-secondary",
      extra: "",
    },
    {
      label: "Response Time",
      value: lastUpdatedMinutes === null ? "—" : String(lastUpdatedMinutes),
      unit: "min",
      valueClass: "text-white",
      extra: "border-l-4 border-l-error",
    },
  ];

  return (
    <div className="absolute bottom-lg left-lg z-30 flex gap-4 font-mono-data">
      {stats.map(({ label, value, unit, valueClass, extra }) => (
        <div
          key={label}
          className={`bg-[#243447]/90 backdrop-blur-sm border border-white/10 px-4 py-2 rounded ${extra}`}
        >
          <div className="text-[10px] text-slate-500 uppercase">{label}</div>
          <div className={`text-xl font-bold ${valueClass}`}>
            {value}
            {unit && <span className="text-xs font-normal"> {unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
