"use client";

import { useEffect, useState } from "react";
import type { AnalyticsMetrics } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import { b3Backend } from "@/lib/b3-backend";
import CameraDetailModal from "./CameraDetailModal";

const LEVEL_STYLE = {
  CRITICAL: { bar: "bg-error", badge: "bg-error-container text-on-error-container", label: "CRITICAL" },
  HIGH: { bar: "bg-error", badge: "bg-error-container text-on-error-container", label: "HIGH" },
  MEDIUM: { bar: "bg-tertiary-container", badge: "bg-tertiary-container text-on-tertiary-container", label: "HEAVY" },
  LOW: { bar: "bg-secondary-container", badge: "bg-surface-container-highest text-on-surface-variant", label: "MODERATE" },
} as const;

const STATIC_SEGMENTS = [
  { id: "I-405 Northbound (Exit 22–25)", speed: "24.5 mph", freq: 85, freqColor: "bg-error", trend: "+12%", trendColor: "text-error", trendIcon: "trending_up", status: "CRITICAL", statusBg: "bg-error-container text-on-error-container" },
  { id: "SR-520 East (Lake Wash Bridge)", speed: "31.2 mph", freq: 62, freqColor: "bg-tertiary-container", trend: "-4%", trendColor: "text-secondary", trendIcon: "trending_down", status: "HEAVY", statusBg: "bg-tertiary-container text-on-tertiary-container" },
  { id: "99 Tunnel (South Entrance)", speed: "44.8 mph", freq: 22, freqColor: "bg-secondary-container", trend: "0%", trendColor: "text-on-surface-variant", trendIcon: "trending_flat", status: "MODERATE", statusBg: "bg-surface-container-highest text-on-surface-variant" },
];

interface CongestedSegmentsTableProps {
  metricsSummary?: AnalyticsMetrics | null;
}

export default function CongestedSegmentsTable({ metricsSummary }: CongestedSegmentsTableProps) {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Store fetched per-segment summaries when historical metrics are provided
  const [segmentSummaries, setSegmentSummaries] = useState<Record<string, { averageSpeedKmh?: number; stoppedRatio?: number }>>({});

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) =>
      setMetrics([...data].sort((a, b) => b.congestionScore - a.congestionScore));
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  // When a historical metricsSummary is available, prefetch per-camera analytics summaries
  useEffect(() => {
    if (!metricsSummary || !metricsSummary.top_segments || !metricsSummary.top_segments.length) return;
    const from = metricsSummary.range_start;
    const to = metricsSummary.range_end;

    let cancelled = false;
    (async () => {
      const map: Record<string, { averageSpeedKmh?: number; stoppedRatio?: number }> = {};
      await Promise.all(metricsSummary.top_segments.map(async (seg) => {
        try {
          const summary = await b3Backend.analytics.getSummary(seg.camera_id, from, to);
          if (summary && (summary.peakWindow || (summary.series && summary.series.length))) {
            if (summary.peakWindow) {
              map[seg.camera_id] = { averageSpeedKmh: summary.averageSpeedKmh ?? summary.peakWindow.averageSpeedKmh, stoppedRatio: summary.peakWindow.stoppedRatio ?? undefined };
            } else {
              const avgSpeed = summary.averageSpeedKmh ?? (summary.series.reduce((s, p) => s + (p.averageSpeedKmh ?? 0), 0) / Math.max(1, summary.series.length));
              const stopped = summary.series.reduce((acc, p) => acc + (p.stoppedRatio ?? 0), 0) / Math.max(1, summary.series.length);
              map[seg.camera_id] = { averageSpeedKmh: avgSpeed, stoppedRatio: stopped };
            }
          }
        } catch {
          // ignore per-segment fetch errors
        }
      }));
      if (!cancelled) setSegmentSummaries(map);
    })();
    return () => { cancelled = true; };
  }, [metricsSummary]);

  const useApi = Boolean(metricsSummary?.top_segments.length);
  const useLive = !useApi && metrics.length > 0;

  return (
    <div className="col-span-12 lg:col-span-9 bg-surface-container border border-white/10 rounded-xl overflow-hidden">
      <div className="p-lg flex justify-between items-center border-b border-white/5">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          {useApi ? "Historical Congested Segments" : useLive ? "Live Camera Congestion" : "Top 10 Congested Segments"}
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
            {useApi ? (
              metricsSummary!.top_segments.map((segment) => {
                const score = Math.round(segment.avg_congestion_score * 100);
                const status = score >= 80 ? LEVEL_STYLE.CRITICAL : score >= 55 ? LEVEL_STYLE.HIGH : score >= 30 ? LEVEL_STYLE.MEDIUM : LEVEL_STYLE.LOW;
                return (
                  <tr key={segment.camera_id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedCamera(segment.camera_id); setModalOpen(true); }}>
                    <td className="px-lg py-md text-on-surface">{segment.road_segment || segment.camera_id}</td>
                    <td className="px-lg py-md">{segmentSummaries[segment.camera_id]?.averageSpeedKmh ? `${segmentSummaries[segment.camera_id].averageSpeedKmh!.toFixed(1)} km/h` : '—'}</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-24 h-1.5 bg-surface-variant rounded-full">
                          <div className={`h-full ${status.bar} rounded-full`} style={{ width: `${Math.min(score, 100)}%` }} />
                        </div>
                        <span>{score}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">{segment.severe_minutes.toFixed(0)} min severe</td>
                    <td className="px-lg py-md">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status.badge}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : useLive ? (
              metrics.map((m) => {
                const style = LEVEL_STYLE[m.congestionLevel] ?? LEVEL_STYLE.LOW;
                const freq = Math.round(m.congestionScore * 100);
                return (
                  <tr key={m.cameraId} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedCamera(m.cameraId); setModalOpen(true); }}>
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
            ) : (
              STATIC_SEGMENTS.map((seg) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedCamera && (
        <CameraDetailModal cameraId={selectedCamera} open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
