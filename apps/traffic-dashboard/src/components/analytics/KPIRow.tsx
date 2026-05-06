"use client";

import { useEffect, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";

export default function KPIRow() {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) => setMetrics(data);
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  const avgIndex = metrics.length
    ? (metrics.reduce((s, m) => s + m.congestionScore, 0) / metrics.length).toFixed(1)
    : null;

  const totalVehicles = metrics.reduce((s, m) => s + m.vehicleCount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
      {/* Congestion Index */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            AVG. CONGESTION INDEX
          </span>
          <span className="text-error text-xs font-mono-data flex items-center">LIVE ↻</span>
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
            {metrics.length} CAM
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
          42.5K <span className="text-sm font-normal text-on-surface-variant">vph</span>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-1">07:00 – 09:00 AM Window</p>
      </div>

      {/* System Uptime */}
      <div className="bg-surface-container border border-white/10 p-md rounded-xl">
        <div className="flex justify-between items-start mb-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
            SYSTEM UPTIME
          </span>
          <span className="text-secondary-fixed-dim text-xs font-mono-data">OPTIMAL</span>
        </div>
        <div className="text-headline-md font-headline-md text-secondary font-medium">99.98%</div>
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
