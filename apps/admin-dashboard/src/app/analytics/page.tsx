"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnalyticsMetrics, analyticsReportUrl, type AnalyticsMetrics } from "@/lib/backend";

const SEVERITY_COLOR: Record<string, string> = {
  EMERGENCY: "bg-error",
  CRITICAL: "bg-error/60",
  WARNING: "bg-tertiary-container",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 16);
}

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

const PRESETS = [
  { label: "Last 24h", hours: 24 },
  { label: "Last 7d", hours: 168 },
  { label: "Last 30d", hours: 720 },
];

export default function AnalyticsPage() {
  const now = new Date();
  const [from, setFrom] = useState(isoDate(new Date(now.getTime() - 24 * 3600 * 1000)));
  const [to, setTo] = useState(isoDate(now));
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsMetrics(new Date(f).toISOString(), new Date(t).toISOString());
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(from, to);
  }, []);

  const applyPreset = (hours: number) => {
    const t = new Date();
    const f = new Date(t.getTime() - hours * 3600 * 1000);
    setFrom(isoDate(f));
    setTo(isoDate(t));
    load(f.toISOString(), t.toISOString());
  };

  const maxPeak = metrics
    ? Math.max(...metrics.peak_hour_distribution.map((h) => h.avg_vehicle_count), 1)
    : 1;

  const pdfUrl = analyticsReportUrl(new Date(from).toISOString(), new Date(to).toISOString());

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-1">Analytics</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Historical traffic metrics, peak hours, and congested segments.
          </p>
        </div>
        <a
          href={pdfUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-caps text-label-caps"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          Export PDF
        </a>
      </div>

      {/* Date range + presets */}
      <div className="flex flex-wrap items-end gap-4 bg-surface-container border border-white/10 rounded-xl p-4">
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant">FROM</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-label-caps text-label-caps text-on-surface-variant">TO</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={() => load(from, to)}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-caps text-label-caps disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="material-symbols-outlined text-[18px]">search</span>
          )}
          {loading ? "Loading…" : "Apply"}
        </button>
        <div className="flex gap-2 ml-auto">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.hours)}
              className="px-3 py-2 rounded border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-label-caps text-label-caps transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-error-container border border-error/20 rounded-xl p-4 text-on-error-container font-body-sm text-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {metrics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container border border-white/10 rounded-xl p-5">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                Avg Congestion Score
              </div>
              <div className="font-display-lg text-display-lg text-on-surface">
                {pct(metrics.avg_congestion_score)}
              </div>
              <div className="w-full h-2 rounded-full bg-surface-variant mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    metrics.avg_congestion_score > 0.8
                      ? "bg-error"
                      : metrics.avg_congestion_score > 0.55
                      ? "bg-tertiary-container"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: pct(metrics.avg_congestion_score) }}
                />
              </div>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-xl p-5">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                Incidents by Severity
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {metrics.incident_pie.map((row) => (
                  <div key={row.severity} className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        SEVERITY_COLOR[row.severity] ?? "bg-outline-variant"
                      }`}
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant capitalize flex-1">
                      {row.severity.toLowerCase()}
                    </span>
                    <span className="font-mono-data text-mono-data text-on-surface">{row.count}</span>
                  </div>
                ))}
                {metrics.incident_pie.length === 0 && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">No incidents.</p>
                )}
              </div>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-xl p-5">
              <div className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                Top Congested Segment
              </div>
              {metrics.top_segments[0] ? (
                <>
                  <div className="font-display-lg text-display-lg text-on-surface">
                    {pct(metrics.top_segments[0].avg_congestion_score)}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {metrics.top_segments[0].road_segment ?? metrics.top_segments[0].camera_id}
                  </p>
                  <p className="font-mono-data text-mono-data text-error text-xs mt-1">
                    {metrics.top_segments[0].severe_minutes.toFixed(0)} min severe
                  </p>
                </>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">No data.</p>
              )}
            </div>
          </div>

          {/* Peak Hour Distribution */}
          <div className="bg-surface-container border border-white/10 rounded-xl p-5">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
              Peak Hour Distribution
            </h3>
            {metrics.peak_hour_distribution.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No data for this period.</p>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-6 border-b border-l border-white/10 pl-1">
                {metrics.peak_hour_distribution.map((h) => {
                  const heightPct = (h.avg_vehicle_count / maxPeak) * 100;
                  const congPct = h.avg_congestion_score;
                  return (
                    <div
                      key={h.hour}
                      className="flex flex-col items-center gap-1 flex-shrink-0"
                      style={{ minWidth: "28px" }}
                      title={`${h.hour}:00 — ${h.avg_vehicle_count.toFixed(0)} vehicles, ${pct(congPct)} congestion`}
                    >
                      <div
                        className={`w-5 rounded-t transition-all ${
                          congPct > 0.8
                            ? "bg-error"
                            : congPct > 0.55
                            ? "bg-tertiary-container"
                            : "bg-primary/60"
                        }`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="font-mono-data text-[9px] text-on-surface-variant">
                        {String(h.hour).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Congested Segments */}
          <div className="bg-surface-container border border-white/10 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Top Congested Segments
              </h3>
            </div>
            {metrics.top_segments.length === 0 ? (
              <p className="p-5 font-body-sm text-body-sm text-on-surface-variant">No data for this period.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-white/10">
                    {["Camera", "Road Segment", "Avg Congestion", "Severe Minutes"].map((h) => (
                      <th key={h} className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {metrics.top_segments.map((seg) => (
                    <tr key={seg.camera_id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                        {seg.camera_id}
                      </td>
                      <td className="p-4 font-body-sm text-body-sm text-on-surface">
                        {seg.road_segment ?? "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-surface-variant overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                seg.avg_congestion_score > 0.8
                                  ? "bg-error"
                                  : seg.avg_congestion_score > 0.55
                                  ? "bg-tertiary-container"
                                  : "bg-emerald-400"
                              }`}
                              style={{ width: pct(seg.avg_congestion_score) }}
                            />
                          </div>
                          <span className="font-mono-data text-mono-data text-on-surface">
                            {pct(seg.avg_congestion_score)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono-data text-mono-data text-error">
                        {seg.severe_minutes.toFixed(1)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!metrics && !loading && !error && (
        <div className="text-center py-16 text-on-surface-variant font-body-sm text-body-sm">
          Select a date range and click Apply to load analytics.
        </div>
      )}
    </>
  );
}