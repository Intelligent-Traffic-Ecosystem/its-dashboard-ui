"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getDashboardEvents, type DashboardSummary, type DashboardEvent } from "@/lib/backend";

const CONGESTION_COLOR: Record<string, string> = {
  LOW: "text-emerald-400",
  MODERATE: "text-tertiary-container",
  HIGH: "text-error",
  SEVERE: "text-error",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function vehicleClassIcon(cls: string) {
  switch (cls?.toLowerCase()) {
    case "truck": return "local_shipping";
    case "bus": return "directions_bus";
    case "motorcycle": return "two_wheeler";
    default: return "directions_car";
  }
}

function vehicleClassColor(cls: string) {
  switch (cls?.toLowerCase()) {
    case "truck": return "bg-tertiary-container/20 text-tertiary-container";
    case "bus": return "bg-primary-container/20 text-primary";
    default: return "bg-surface-variant text-on-surface-variant";
  }
}

export default function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [s, e] = await Promise.allSettled([
      getDashboardSummary(),
      getDashboardEvents(10),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (e.status === "fulfilled") setEvents(e.value);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  const congestionLevel = summary?.overall_congestion_level ?? "—";
  const congestionColor = CONGESTION_COLOR[congestionLevel] ?? "text-on-surface";

  return (
    <>
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Active Incidents</span>
            <span className="material-symbols-outlined text-[20px]">report</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {loading ? <span className="opacity-40">—</span> : (summary?.total_incidents_24h ?? "—")}
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">Last 24 hours</div>
        </div>

        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Avg Speed</span>
            <span className="material-symbols-outlined text-[20px]">speed</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {loading ? (
              <span className="opacity-40">—</span>
            ) : (
              <>
                {summary?.avg_speed_kmh?.toFixed(1) ?? "—"}
                <span className="text-title-sm text-on-surface-variant"> km/h</span>
              </>
            )}
          </div>
          <div className="font-body-sm text-body-sm text-emerald-400">Network average</div>
        </div>

        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Congestion Level</span>
            <span className="material-symbols-outlined text-[20px]">traffic</span>
          </div>
          <div className={`font-display-lg text-display-lg ${congestionColor}`}>
            {loading ? <span className="opacity-40">—</span> : congestionLevel}
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            {summary ? `Score: ${(summary.overall_congestion_score * 100).toFixed(0)}%` : "Citywide"}
          </div>
        </div>

        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Active Alerts</span>
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {loading ? <span className="opacity-40">—</span> : (summary?.active_alerts ?? "—")}
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            {summary ? `Updated ${relativeTime(summary.last_updated)}` : "Across all zones"}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-margin">
        {/* Congestion Score Bar */}
        <div className="lg:col-span-2 bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Congestion Overview</h3>
            {summary && (
              <span className="font-mono-data text-mono-data text-on-surface-variant text-xs">
                Updated {relativeTime(summary.last_updated)}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
              Loading…
            </div>
          ) : summary ? (
            <div className="flex-1 flex flex-col justify-center gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Overall Congestion Score</span>
                  <span className="font-mono-data text-mono-data text-on-surface">
                    {(summary.overall_congestion_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-variant overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      summary.overall_congestion_score > 0.8
                        ? "bg-error"
                        : summary.overall_congestion_score > 0.55
                        ? "bg-tertiary-container"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${(summary.overall_congestion_score * 100).toFixed(1)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="font-display-lg text-display-lg text-on-surface">
                    {summary.total_incidents_24h}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Incidents (24h)</div>
                </div>
                <div className="text-center">
                  <div className="font-display-lg text-display-lg text-on-surface">
                    {summary.avg_speed_kmh.toFixed(0)}
                    <span className="text-title-sm text-on-surface-variant"> km/h</span>
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Avg Network Speed</div>
                </div>
                <div className="text-center">
                  <div className={`font-display-lg text-display-lg ${congestionColor}`}>
                    {congestionLevel}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">Network Status</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
              Backend not reachable. Start the backend to see live data.
            </div>
          )}
        </div>

        {/* Live Event Feed */}
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Live Event Feed</h3>
            <button onClick={refresh} className="text-primary hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="text-center text-on-surface-variant font-body-sm text-body-sm py-8">Loading…</div>
            ) : events.length === 0 ? (
              <div className="text-center text-on-surface-variant font-body-sm text-body-sm py-8">
                No events. Backend may be offline.
              </div>
            ) : (
              events.map((ev, i) => (
                <div
                  key={i}
                  className="p-3 bg-surface border border-white/5 rounded flex gap-3 hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded ${vehicleClassColor(ev.vehicle_class)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="material-symbols-outlined text-[18px]">{vehicleClassIcon(ev.vehicle_class)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-caps text-label-caps text-primary truncate">
                        {ev.camera_id}
                      </span>
                      <span className="font-mono-data text-mono-data text-on-surface-variant text-[10px] ml-2 flex-shrink-0">
                        {relativeTime(ev.timestamp)}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                      {ev.vehicle_class ?? "Vehicle"} — {ev.speed_kmh?.toFixed(1)} km/h
                      {ev.lane_id != null ? `, lane ${ev.lane_id}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}