"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyticsMetrics } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import CameraDetailModal from "./CameraDetailModal";

const LEVEL_STYLE = {
  SEVERE:   { bar: "bg-error",               badge: "bg-error-container text-on-error-container",             label: "SEVERE"    },
  HIGH:     { bar: "bg-error",               badge: "bg-error-container text-on-error-container",             label: "HIGH"      },
  MODERATE: { bar: "bg-tertiary-container",  badge: "bg-tertiary-container text-on-tertiary-container",       label: "MODERATE"  },
  LOW:      { bar: "bg-secondary-container", badge: "bg-surface-container-highest text-on-surface-variant",   label: "LOW"       },
} as const;

// Static road names for mock cameras — used when CameraRegistry has no entry.
// Keys cover both bare ("cam1") and zero-padded underscore ("cam_01") formats.
const CAMERA_ROADS: Record<string, string> = {
  cam1: "Galle Road",     cam_01: "Galle Road",
  cam2: "High Level Road", cam_02: "High Level Road",
  cam3: "Kandy Road",      cam_03: "Kandy Road",
  cam4: "Nugegoda Junction", cam_04: "Nugegoda Junction",
  cam5: "Rajagiriya",      cam_05: "Rajagiriya",
  cam6: "Borella Junction", cam_06: "Borella Junction",
  cam7: "Maradana",        cam_07: "Maradana",
  cam8: "Pettah Bus Terminal", cam_08: "Pettah Bus Terminal",
};

/** Returns a human-readable location label for a camera / segment. */
function getCameraLocation(cameraId: string, roadSegment?: string | null): string {
  // If the API gave a real road name (not just the raw cam ID) prefer it
  if (roadSegment && !/^cam[_]?\d+$/i.test(roadSegment)) return roadSegment;
  return CAMERA_ROADS[cameraId] ?? cameraId;
}

function scoreToLevelStyle(score: number) {
  if (score >= 80) return LEVEL_STYLE.SEVERE;
  if (score >= 55) return LEVEL_STYLE.HIGH;
  if (score >= 30) return LEVEL_STYLE.MODERATE;
  return LEVEL_STYLE.LOW;
}

interface CongestedSegmentsTableProps {
  metricsSummary?: AnalyticsMetrics | null;
}

export default function CongestedSegmentsTable({ metricsSummary }: CongestedSegmentsTableProps) {
  const [liveMetrics, setLiveMetrics] = useState<TrafficMetric[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Keep live metrics updated by WebSocket
  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) => setLiveMetrics(data);
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  // Deduplicate by cameraId — keep the row with the highest congestion score per camera,
  // then sort descending. The socket may send per-lane rows for the same camera.
  const dedupedLive = useMemo(() => {
    const map: Record<string, TrafficMetric> = {};
    liveMetrics.forEach((m) => {
      if (!map[m.cameraId] || m.congestionScore > map[m.cameraId].congestionScore) {
        map[m.cameraId] = m;
      }
    });
    return Object.values(map).sort((a, b) => b.congestionScore - a.congestionScore);
  }, [liveMetrics]);

  // Map from cameraId → live metric for O(1) lookups in API mode
  const liveScoreMap = useMemo(() => {
    const map: Record<string, TrafficMetric> = {};
    dedupedLive.forEach((m) => { map[m.cameraId] = m; });
    return map;
  }, [dedupedLive]);

  const hasApiSegments = Boolean(metricsSummary?.top_segments?.length);
  const hasLive = dedupedLive.length > 0;

  const openModal = (cameraId: string) => { setSelectedCamera(cameraId); setModalOpen(true); };

  return (
    <div className="col-span-12 lg:col-span-9 bg-surface-container border border-white/10 rounded-xl overflow-hidden">
      <div className="p-lg flex justify-between items-center border-b border-white/5">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          {hasApiSegments ? "Historical Congested Segments" : hasLive ? "Live Camera Congestion" : "Top 10 Congested Segments"}
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
              {["CAMERA / SEGMENT", "LOCATION", "CONGESTION SCORE", "AVG. SPEED", "STOPPED RATIO", "STATUS"].map((h) => (
                <th key={h} className="px-lg py-md text-label-caps font-label-caps text-on-surface-variant uppercase tracking-[0.08em] font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono-data text-body-sm">
            {hasApiSegments ? (
              metricsSummary!.top_segments.map((segment) => {
                const live = liveScoreMap[segment.camera_id];
                // avg_congestion_score is already 0-100; live.congestionScore is 0-1 scale
                const score = live
                  ? Math.round(live.congestionScore * 100)
                  : Math.round(segment.avg_congestion_score);
                const style = scoreToLevelStyle(score);
                const speedKmh = live ? live.averageSpeedKmh : null;
                const stoppedRatio = live ? live.stoppedRatio : null;
                const location = getCameraLocation(segment.camera_id, segment.road_segment);

                return (
                  <tr
                    key={segment.camera_id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => openModal(segment.camera_id)}
                  >
                    <td className="px-lg py-md text-on-surface font-semibold">
                      {segment.camera_id}
                      {live && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="px-lg py-md text-on-surface-variant text-xs">{location}</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-24 h-1.5 bg-surface-variant rounded-full">
                          <div className={`h-full ${style.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(score, 100)}%` }} />
                        </div>
                        <span>{score}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      {speedKmh != null ? `${speedKmh.toFixed(1)} km/h` : "—"}
                    </td>
                    <td className="px-lg py-md">
                      {stoppedRatio != null ? `${(stoppedRatio * 100).toFixed(0)}%` : `${segment.severe_minutes.toFixed(0)} min severe`}
                    </td>
                    <td className="px-lg py-md">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.badge}`}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : hasLive ? (
              dedupedLive.map((m) => {
                const style = LEVEL_STYLE[m.congestionLevel] ?? LEVEL_STYLE.LOW;
                const score = Math.round(m.congestionScore * 100);
                const location = getCameraLocation(m.cameraId);
                return (
                  <tr
                    key={m.cameraId}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => openModal(m.cameraId)}
                  >
                    <td className="px-lg py-md text-on-surface font-semibold">
                      {m.cameraId}
                      <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        LIVE
                      </span>
                    </td>
                    <td className="px-lg py-md text-on-surface-variant text-xs">{location}</td>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-24 h-1.5 bg-surface-variant rounded-full">
                          <div className={`h-full ${style.bar} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                        </div>
                        <span>{score}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">{m.averageSpeedKmh.toFixed(1)} km/h</td>
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
              // Placeholder rows while data loads
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-lg py-md">
                      <div className="h-3 bg-surface-variant rounded w-3/4" />
                    </td>
                  ))}
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
