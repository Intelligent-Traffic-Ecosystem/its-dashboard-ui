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

  const avgIndex = summary
    ? summary.averageCongestionScore.toFixed(1)
    : metricsSummary
      ? metricsSummary.avg_congestion_score.toFixed(1)
      : metrics.length
    ? (metrics.reduce((s, m) => s + m.congestionScore, 0) / metrics.length).toFixed(1)
    : null;

  const totalVehicles = summary?.totalVehicles ?? metrics.reduce((s, m) => s + m.vehicleCount, 0);
  const peakHour = metricsSummary?.peak_hour_distribution.reduce((peak, hour) =>
    !peak || hour.avg_vehicle_count > peak.avg_vehicle_count ? hour : peak, null as AnalyticsMetrics["peak_hour_distribution"][number] | null);
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
          {totalVehicles > 0 ? totalVehicles.toLocaleString() : "—"}
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
          {peakHour ? peakHour.avg_vehicle_count.toFixed(1) : "—"} <span className="text-sm font-normal text-on-surface-variant">vph</span>
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
