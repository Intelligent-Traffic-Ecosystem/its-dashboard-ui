"use client";

import { useEffect, useState } from "react";
import type { AnalyticsMetrics } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";

interface CongestionIndexChartProps {
  metricsSummary?: AnalyticsMetrics | null;
}

export default function CongestionIndexChart({ metricsSummary }: CongestionIndexChartProps) {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) => setMetrics(data);
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  // One bar per camera; fall back to placeholder bars while no data
  const bars: { label: string; height: number }[] =
    metricsSummary?.peak_hour_distribution.length
      ? metricsSummary.peak_hour_distribution.map((hour) => ({
          label: `${String(hour.hour).padStart(2, "0")}:00`,
          height: Math.round(hour.avg_congestion_score),
        }))
      : metrics.length > 0
      ? metrics.map((m) => ({ label: m.cameraId, height: Math.round(m.congestionScore) }))
      : [40, 55, 45, 70, 65, 30, 50, 85, 60, 40].map((h) => ({ label: `—`, height: h }));

  const maxH = Math.max(...bars.map((b) => b.height), 1);

  return (
    <div className="col-span-8 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
      <div className="flex justify-between items-center mb-xl">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          {metricsSummary ? "Historical Congestion Score — Peak Hours" : "Live Congestion Score — Per Camera"}
        </h3>
        <div className="flex items-center gap-md">
          <span className="flex items-center gap-xs text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Congestion Score
          </span>
          <span className="flex items-center gap-xs text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-outline-variant inline-block" />
            {metricsSummary ? `${bars.length} hourly windows` : metrics.length > 0 ? `${metrics.length} cameras` : "demo data"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative flex items-end gap-1">
        <div className="absolute inset-0 flex flex-col justify-between py-xs pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-white/5 w-full" />
          ))}
        </div>

        <div className="relative w-full h-full flex items-end px-md gap-4">
          {bars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 border-t-2 border-primary rounded-t-sm transition-all duration-700"
              style={{ height: `${(bar.height / maxH) * 100}%` }}
              title={`${bar.label}: ${bar.height}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-md px-md text-[10px] text-on-surface-variant font-mono-data">
        {metricsSummary ? (
          bars.slice(0, 8).map((bar) => <span key={bar.label}>{bar.label}</span>)
        ) : metrics.length > 0 ? (
          metrics.map((m) => <span key={m.cameraId}>{m.cameraId}</span>)
        ) : (
          <>
            <span>CAM 1</span>
            <span>CAM 5</span>
            <span>CAM 10</span>
          </>
        )}
      </div>
    </div>
  );
}
