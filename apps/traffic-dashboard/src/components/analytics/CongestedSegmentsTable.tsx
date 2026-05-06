"use client";

import { useEffect, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";

const LEVEL_STYLE = {
  CRITICAL: { bar: "bg-error",                  badge: "bg-error-container text-on-error-container",                   label: "CRITICAL" },
  HIGH:     { bar: "bg-error",                  badge: "bg-error-container text-on-error-container",                   label: "HIGH" },
  MEDIUM:   { bar: "bg-tertiary-container",     badge: "bg-tertiary-container text-on-tertiary-container",             label: "HEAVY" },
  LOW:      { bar: "bg-secondary-container",    badge: "bg-surface-container-highest text-on-surface-variant",         label: "MODERATE" },
} as const;

const STATIC_SEGMENTS = [
  { id: "I-405 Northbound (Exit 22–25)", speed: "24.5 mph", freq: 85, freqColor: "bg-error",             trend: "+12%", trendColor: "text-error",              trendIcon: "trending_up",   status: "CRITICAL", statusBg: "bg-error-container text-on-error-container" },
  { id: "SR-520 East (Lake Wash Bridge)", speed: "31.2 mph", freq: 62, freqColor: "bg-tertiary-container", trend: "-4%",  trendColor: "text-secondary",           trendIcon: "trending_down", status: "HEAVY",    statusBg: "bg-tertiary-container text-on-tertiary-container" },
  { id: "99 Tunnel (South Entrance)",    speed: "44.8 mph", freq: 22, freqColor: "bg-secondary-container", trend: "0%",   trendColor: "text-on-surface-variant",  trendIcon: "trending_flat", status: "MODERATE", statusBg: "bg-surface-container-highest text-on-surface-variant" },
];

export default function CongestedSegmentsTable() {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) =>
      setMetrics([...data].sort((a, b) => b.congestionScore - a.congestionScore));
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  const useLive = metrics.length > 0;

  return (
    <div className="col-span-12 lg:col-span-9 bg-surface-container border border-white/10 rounded-xl overflow-hidden">
      <div className="p-lg flex justify-between items-center border-b border-white/5">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          {useLive ? "Live Camera Congestion" : "Top 10 Congested Segments"}
        </h3>
        <div className="flex gap-sm">
          <button className="bg-surface-variant p-1 rounded hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
          <button className="bg-surface-variant p-1 rounded hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-sm">more_vert</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-white/5">
            <tr>
              {["CAMERA / SEGMENT ID", "AVG. SPEED", "CONGESTION SCORE", "STOPPED RATIO", "STATUS"].map((h) => (
                <th key={h} className="px-lg py-md text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono-data text-body-sm">
            {useLive
              ? metrics.map((m) => {
                  const style = LEVEL_STYLE[m.congestionLevel] ?? LEVEL_STYLE.LOW;
                  const freq = Math.round(m.congestionScore);
                  return (
                    <tr key={m.cameraId} className="hover:bg-white/5 transition-colors">
                      <td className="px-lg py-md text-on-surface">{m.cameraId}</td>
                      <td className="px-lg py-md">{m.averageSpeedKmh.toFixed(1)} km/h</td>
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className="w-24 h-1.5 bg-surface-variant rounded-full">
                            <div className={`h-full ${style.bar} rounded-full`} style={{ width: `${freq}%` }} />
                          </div>
                          <span>{freq}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md">{(m.stoppedRatio * 100).toFixed(0)}%</td>
                      <td className="px-lg py-md">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.badge}`}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              : STATIC_SEGMENTS.map((seg) => (
                  <tr key={seg.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-lg py-md text-on-surface">{seg.id}</td>
                    <td className="px-lg py-md">{seg.speed}</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-24 h-1.5 bg-surface-variant rounded-full">
                          <div className={`h-full ${seg.freqColor} rounded-full`} style={{ width: `${seg.freq}%` }} />
                        </div>
                        <span>{seg.freq}%</span>
                      </div>
                    </td>
                    <td className={`px-lg py-md ${seg.trendColor} flex items-center gap-xs`}>
                      <span className="material-symbols-outlined text-sm">{seg.trendIcon}</span>
                      {seg.trend}
                    </td>
                    <td className="px-lg py-md">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${seg.statusBg}`}>
                        {seg.status}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
