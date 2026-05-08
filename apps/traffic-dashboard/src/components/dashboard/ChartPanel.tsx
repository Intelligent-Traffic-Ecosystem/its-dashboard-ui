"use client";

/**
 * REQ-FR-003: Time-series line chart — traffic volume for the past 60 minutes,
 * updated in real time via Socket.IO.
 * REQ-FR-004: Time range selector — Last 1H / 6H / 24H (P2).
 */
import { useEffect, useMemo, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import { useCurrentCongestion } from "@/lib/hooks/useB3Backend";

interface DataPoint { t: number; v: number }

type Range = "1H" | "6H" | "24H";
const RANGE_MS: Record<Range, number> = {
  "1H":  60 * 60 * 1000,
  "6H":  6 * 60 * 60 * 1000,
  "24H": 24 * 60 * 60 * 1000,
};

const W = 500;
const H = 120;
const PAD = { t: 8, r: 8, b: 24, l: 36 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;

function toSvg(points: DataPoint[], windowMs: number, now: number) {
  if (points.length < 2) return { line: "", area: "" };
  const minT = now - windowMs;
  const maxV = Math.max(...points.map((p) => p.v), 1);

  const cx = (t: number) => ((t - minT) / windowMs) * INNER_W + PAD.l;
  const cy = (v: number) => PAD.t + INNER_H - (v / maxV) * INNER_H;

  const pts = points.map((p) => [cx(p.t), cy(p.v)] as [number, number]);
  const coords = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  const line = `M${coords}`;
  const area = `M${pts[0][0].toFixed(1)},${(PAD.t + INNER_H).toFixed(1)} L${coords} L${pts[pts.length - 1][0].toFixed(1)},${(PAD.t + INNER_H).toFixed(1)} Z`;

  return { line, area };
}

function xLabels(windowMs: number, now: number, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const t = now - windowMs + (i / (count - 1)) * windowMs;
    const d = new Date(t);
    const label = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const x = PAD.l + (i / (count - 1)) * INNER_W;
    return { x, label };
  });
}

function yGridLines(maxV: number, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const frac = i / (count - 1);
    const v = Math.round(maxV * (1 - frac));
    const y = PAD.t + frac * INNER_H;
    return { y, v };
  });
}

export default function ChartPanel() {
  const { data: initialMetrics } = useCurrentCongestion();
  const [range, setRange] = useState<Range>("1H");
  const [allPoints, setAllPoints] = useState<DataPoint[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 5_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onCongestion = (data: TrafficMetric[]) => {
      if (!data.length) return;
      const total = data.reduce((s, m) => s + m.vehicleCount, 0);
      const score = data.reduce((s, m) => s + m.congestionScore, 0) / data.length;
      setAvgScore(Math.round(score));
      const pointTime = new Date().getTime();
      setAllPoints((prev) => {
        const next = [...prev, { t: pointTime, v: total }];
        // prune older than 24h (max range)
        const cutoff = pointTime - RANGE_MS["24H"];
        return next.filter((p) => p.t >= cutoff);
      });
    };
    socket.on("traffic:congestion", onCongestion);
    return () => { socket.off("traffic:congestion", onCongestion); };
  }, []);

  const windowMs = RANGE_MS[range];
  const initialPoint = useMemo(() => {
    if (!initialMetrics?.length) return null;
    const total = initialMetrics.reduce((s, m) => s + m.vehicleCount, 0);
    const latest = initialMetrics
      .map((m) => (m.windowEnd ? new Date(m.windowEnd).getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    return { t: latest || now, v: total };
  }, [initialMetrics, now]);
  const seedPoints = allPoints.length ? allPoints : initialPoint ? [initialPoint] : [];
  const cutoff = now - windowMs;
  const visible = seedPoints.filter((p) => p.t >= cutoff);
  const maxV = Math.max(...visible.map((p) => p.v), 1);
  const { line, area } = toSvg(visible, windowMs, now);
  const labels = xLabels(windowMs, now);
  const grid   = yGridLines(maxV);
  const initialAvgScore = initialMetrics?.length
    ? Math.round(initialMetrics.reduce((s, m) => s + m.congestionScore, 0) / initialMetrics.length)
    : null;
  const load   = avgScore ?? initialAvgScore ?? 0;

  return (
    <div className="bg-surface-container border border-white/10 rounded p-md space-y-6">

      {/* Header + range selector (REQ-FR-004) */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white">
          TRAFFIC VOLUME
        </h3>
        <div className="flex gap-1 bg-surface-container-high rounded p-0.5">
          {(["1H", "6H", "24H"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                range === r ? "bg-primary text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG line chart (REQ-FR-003) */}
      <div className="w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto overflow-visible"
          aria-label="Traffic volume time-series chart"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#adc6ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#adc6ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y grid + labels */}
          {grid.map(({ y, v }) => (
            <g key={y}>
              <line x1={PAD.l} y1={y} x2={PAD.l + INNER_W} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PAD.l - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#64748b">{v}</text>
            </g>
          ))}

          {/* X axis base */}
          <line x1={PAD.l} y1={PAD.t + INNER_H} x2={PAD.l + INNER_W} y2={PAD.t + INNER_H} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Area fill */}
          {area && <path d={area} fill="url(#areaGrad)" />}

          {/* Line */}
          {line
            ? <path d={line} fill="none" stroke="#adc6ff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            : <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="10" fill="#475569">Waiting for data…</text>
          }

          {/* X labels */}
          {labels.map(({ x, label }, i) => (
            <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="7" fill="#64748b">{label}</text>
          ))}
        </svg>
      </div>

      {/* Congestion gauge */}
      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">CONGESTION LOAD</h3>
          <span className="text-[10px] font-mono-data text-primary">{avgScore !== null || initialAvgScore !== null ? `${load}/100` : "—"}</span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              load >= 80 ? "bg-error" : load >= 55 ? "bg-tertiary" : load >= 30 ? "bg-yellow-500" : "bg-secondary"
            }`}
            style={{ width: `${load}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] font-mono-data text-slate-600">
          <span>FREE FLOW</span><span>MODERATE</span><span>GRIDLOCK</span>
        </div>
      </div>
    </div>
  );
}
