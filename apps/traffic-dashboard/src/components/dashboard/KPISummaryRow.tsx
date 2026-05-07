"use client";

/**
 * REQ-FR-002: Summary panel — total active incidents, average network speed,
 * congestion level (Low/Moderate/High/Critical), and active alert count.
 */
import { useEffect, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import { useCurrentCongestion, useDashboardSummary } from "@/lib/hooks/useB3Backend";

const LEVEL_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as const;

// REQ-DR-001: Standard four-tier display labels
const LEVEL_LABEL: Record<string, string> = {
  LOW:      "Low",
  MEDIUM:   "Moderate",
  HIGH:     "High",
  CRITICAL: "Critical",
};

const LEVEL_CLASS: Record<string, string> = {
  LOW:      "text-secondary",
  MEDIUM:   "text-tertiary",
  HIGH:     "text-error",
  CRITICAL: "text-error",
};

function deriveStats(metrics: TrafficMetric[]) {
  if (!metrics.length) return null;
  const avgSpeed = metrics.reduce((s, m) => s + m.averageSpeedKmh, 0) / metrics.length;
  const maxLevel = metrics.reduce<TrafficMetric["congestionLevel"]>((max, m) =>
    LEVEL_ORDER[m.congestionLevel] > LEVEL_ORDER[max] ? m.congestionLevel : max, "LOW");
  const incidents = metrics.filter(
    (m) => m.congestionLevel === "HIGH" || m.congestionLevel === "CRITICAL"
  ).length;
  // REQ-DR-004: detect stale data (>30s since last windowEnd)
  const latest = metrics
    .map((m) => (m.windowEnd ? new Date(m.windowEnd).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  const stale = latest > 0 && Date.now() - latest > 30_000;
  return { avgSpeed, maxLevel, incidents, stale };
}

export default function KPISummaryRow() {
  const { data: summary, error: summaryError } = useDashboardSummary();
  const { data: initialMetrics } = useCurrentCongestion();
  const [socketMetrics, setSocketMetrics] = useState<TrafficMetric[]>([]);
  const [sessionAlertCount, setSessionAlertCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onCongestion = (data: TrafficMetric[]) => setSocketMetrics(data);
    const onAlert      = () => setSessionAlertCount((n) => n + 1);

    socket.on("connect",           onConnect);
    socket.on("disconnect",        onDisconnect);
    socket.on("traffic:congestion", onCongestion);
    socket.on("alert:new",         onAlert);
    queueMicrotask(() => setConnected(socket.connected));

    return () => {
      socket.off("connect",           onConnect);
      socket.off("disconnect",        onDisconnect);
      socket.off("traffic:congestion", onCongestion);
      socket.off("alert:new",         onAlert);
    };
  }, []);

  const metrics = socketMetrics.length ? socketMetrics : initialMetrics ?? [];
  const s = deriveStats(metrics);
  const summaryLevel = summary?.overall_congestion_level === "MODERATE"
    ? "MEDIUM"
    : summary?.overall_congestion_level === "SEVERE"
      ? "CRITICAL"
      : summary?.overall_congestion_level;
  const activeIncidents = summary ? summary.total_incidents_24h : s?.incidents;
  const averageSpeed = summary ? summary.avg_speed_kmh : s?.avgSpeed;
  const congestionLevel = summaryLevel || s?.maxLevel;
  const alertCount = (summary?.active_alerts_count ?? summary?.active_alerts ?? 0) + sessionAlertCount;

  const kpis = [
    {
      label: "ACTIVE INCIDENTS",
      value: activeIncidents !== undefined ? String(activeIncidents).padStart(2, "0") : "—",
      valueClass: activeIncidents && activeIncidents > 0 ? "text-error" : "text-white",
      sub: metrics.length ? `${metrics.length} cameras online` : connected ? "waiting for data…" : summaryError ? "backend unavailable" : "offline",
      dot: activeIncidents !== undefined ? activeIncidents > 0 : false,
      dotColor: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    },
    {
      label: "AVG NETWORK SPEED",
      value: averageSpeed !== undefined ? Math.round(averageSpeed).toString() : "—",
      unit: "KM/H",
      valueClass: "text-primary",
      sub: connected ? (s?.stale ? "⚠ DATA STALE" : "live · 5s refresh") : "no connection",
      dot: connected,
      dotColor: s?.stale ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    },
    {
      label: "CONGESTION LEVEL",
      value: congestionLevel ? LEVEL_LABEL[congestionLevel] ?? congestionLevel : "—",
      valueClass: congestionLevel ? LEVEL_CLASS[congestionLevel] ?? "text-slate-500" : "text-slate-500",
      sub: "network-wide peak",
      dot: false,
    },
    {
      label: "ACTIVE ALERTS",
      value: String(alertCount).padStart(2, "0"),
      valueClass: alertCount > 0 ? "text-tertiary" : "text-white",
      sub: alertCount > 0 ? "this session" : "all clear",
      dot: alertCount > 0,
      dotColor: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]",
    },
  ];

  // REQ-NFR-008: degraded mode notice
  if (!connected && !summary) {
    return (
      <div className="col-span-4 bg-surface-container border border-yellow-500/30 rounded p-md text-center text-yellow-400 text-xs font-mono-data tracking-widest">
        ⚠ DEGRADED MODE — Socket.IO offline. Reconnecting…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface-container border border-white/10 p-md rounded flex flex-col justify-between h-28 relative overflow-hidden"
        >
          {kpi.dot && (
            <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${kpi.dotColor}`} />
          )}
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            {kpi.label}
          </span>
          <span className={`font-semibold text-3xl leading-none ${kpi.valueClass}`}>
            {kpi.value}
            {kpi.unit && <span className="text-sm font-normal ml-1">{kpi.unit}</span>}
          </span>
          <span className={`text-[10px] font-mono-data ${s?.stale && kpi.label === "AVG NETWORK SPEED" ? "text-yellow-400" : "text-slate-500"}`}>
            {kpi.sub}
          </span>
        </div>
      ))}
    </div>
  );
}
