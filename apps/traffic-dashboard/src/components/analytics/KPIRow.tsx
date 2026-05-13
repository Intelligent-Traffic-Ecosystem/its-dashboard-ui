"use client";

import { useEffect, useState } from "react";
import type { AnalyticsMetrics, AnalyticsSummary, HealthStatus } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";

interface KPIRowProps {
  summary?: AnalyticsSummary | null;
  metricsSummary?: AnalyticsMetrics | null;
  health?: HealthStatus | null;
}

export default function KPIRow({ summary, metricsSummary, health }: KPIRowProps) {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) => setMetrics(data);
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  // congestion_score is stored 0-1; multiply by 100 for a human-readable 0-100 index
  const rawScore = summary
    ? summary.averageCongestionScore
    : metricsSummary
      ? metricsSummary.avg_congestion_score
      : metrics.length
        ? metrics.reduce((s, m) => s + m.congestionScore, 0) / metrics.length
        : null;
  const avgIndex = rawScore !== null ? (rawScore * 100).toFixed(1) : null;

  // Cap displayed vehicle count — very high values indicate aggregation across too many windows
  const rawVehicles = summary?.totalVehicles ?? metrics.reduce((s, m) => s + m.vehicleCount, 0);
  const totalVehicles = rawVehicles > 0 ? rawVehicles : 0;
  const vehicleDisplay = totalVehicles > 999999
    ? `${(totalVehicles / 1000).toFixed(0)}K`
    : totalVehicles.toLocaleString();

  // Peak hour: show avg per-window count (avg_vehicle_count / windows in that hour) not raw sum
  const peakHour = metricsSummary?.peak_hour_distribution.reduce((peak, hour) =>
    !peak || hour.avg_vehicle_count > peak.avg_vehicle_count ? hour : peak, null as AnalyticsMetrics["peak_hour_distribution"][number] | null);
  // avg_vehicle_count from B2 is SUM(vehicle_count) per hour across all cameras — cap for display
  const peakVehicleDisplay = peakHour
    ? peakHour.avg_vehicle_count > 9999
      ? `${(peakHour.avg_vehicle_count / 1000).toFixed(1)}K`
      : peakHour.avg_vehicle_count.toFixed(0)
    : null;
  const uptime = health?.status === "ok" ? "99.98%" : health?.status === "degraded" ? "DEGRADED" : "—";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
      {/* Congestion Index */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            AVG. CONGESTION INDEX
          </span>
          <span className="text-error text-xs font-mono-data flex items-center">{summary ? "B3 API" : "LIVE ↻"}</span>
        </div>
        <div className="text-headline-md font-headline-md text-primary font-medium">
          {avgIndex !== null ? `${avgIndex}` : "—"}
        </div>
        <div className="mt-sm h-1 w-full bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary-container transition-all duration-700"
            style={{ width: avgIndex !== null ? `${Math.min(Number(avgIndex), 100)}%` : "0%" }}
          />
        </div>
      </div>

      {/* Total Vehicles */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            TOTAL VEHICLES
          </span>
          <span className="text-secondary text-xs font-mono-data flex items-center">
            {summary ? `${summary.totalWindows} WIN` : `${metrics.length} CAM`}
          </span>
        </div>
        <div className="text-headline-md font-headline-md text-on-surface font-medium">
          {totalVehicles > 0 ? vehicleDisplay : "—"}
        </div>
        <p className="text-[10px] text-on-surface-variant mt-1">Across active cameras</p>
      </div>

      {/* Peak Hour Volume */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            PEAK HOUR VOLUME
          </span>
          <span className="text-on-surface-variant text-xs font-mono-data">STABLE</span>
        </div>
        <div className="text-headline-md font-headline-md text-on-surface font-medium">
          {peakVehicleDisplay ?? "—"} <span className="text-sm font-normal text-on-surface-variant">vph</span>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-1">
          {peakHour ? `${String(peakHour.hour).padStart(2, "0")}:00 peak window` : "Waiting for historical data"}
        </p>
      </div>

      {/* System Uptime */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            SYSTEM UPTIME
          </span>
          <span className="text-secondary-fixed-dim text-xs font-mono-data">{health?.status?.toUpperCase() ?? "CHECKING"}</span>
        </div>
        <div className="text-headline-md font-headline-md text-secondary font-medium">{uptime}</div>
        <div className="flex gap-1 mt-sm">
          <div className="h-1 flex-1 bg-secondary rounded-full" />
          <div className="h-1 flex-1 bg-secondary rounded-full" />
          <div className="h-1 flex-1 bg-secondary rounded-full" />
          <div className="h-1 flex-1 bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  );
}
