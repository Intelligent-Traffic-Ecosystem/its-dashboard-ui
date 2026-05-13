"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnalyticsMetrics, AnalyticsSummary } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";

interface CongestionIndexChartProps {
    cameraId?: string;
    metricsSummary?: AnalyticsMetrics | null;
    cameraSummary?: AnalyticsSummary | null;
}

type ChartPoint = { label: string; value: number };

function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
}

function smoothPath(pts: Array<{ x: number; y: number }>, t = 0.3): string {
    if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x} ${pts[0].y}` : "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) * t;
        const cp1y = p1.y + (p2.y - p0.y) * t;
        const cp2x = p2.x - (p3.x - p1.x) * t;
        const cp2y = p2.y - (p3.y - p1.y) * t;
        d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
}

const Y_TICKS = [0, 25, 50, 75, 100];
const PAD_TOP = 8;
const PAD_BOTTOM = 4;

export default function CongestionIndexChart({ cameraId, metricsSummary, cameraSummary }: CongestionIndexChartProps) {
    const [liveTrail, setLiveTrail] = useState<ChartPoint[]>([]);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => { setLiveTrail([]); }, [cameraId]);

    useEffect(() => {
        const socket = getSocket();
        const onCongestion = (data: TrafficMetric[]) => {
            if (!cameraId) return;
            const metric = data.find((m) => m.cameraId === cameraId);
            if (!metric) return;
            const label = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setLiveTrail((prev) => [...prev.slice(-59), { label, value: Math.round(metric.congestionScore * 100) }]);
        };
        socket.on("traffic:congestion", onCongestion);
        return () => { socket.off("traffic:congestion", onCongestion); };
    }, [cameraId]);

    const chartData = useMemo((): ChartPoint[] => {
        if (cameraSummary?.series.length) {
            return cameraSummary.series.map((e) => ({
                label: e.windowEnd
                    ? new Date(e.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "—",
                value: Math.round(clamp(e.congestionScore * 100, 0, 100)),
            }));
        }
        if (metricsSummary?.peak_hour_distribution.length) {
            return metricsSummary.peak_hour_distribution.map((e) => ({
                label: `${String(e.hour).padStart(2, "0")}:00`,
                value: Math.round(clamp(e.avg_congestion_score * 100, 0, 100)),
            }));
        }
        if (liveTrail.length) return liveTrail;
        return [40, 55, 45, 70, 65, 30, 50, 85, 60, 40].map((value, i) => ({ label: `${i + 1}`, value }));
    }, [cameraSummary, metricsSummary, liveTrail]);

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2] ?? latest;
    const delta = latest && previous ? latest.value - previous.value : 0;
    const lineColor = delta > 2 ? "#f87171" : delta < -2 ? "#4ade80" : "#818cf8";

    const toY = (v: number) => PAD_TOP + (1 - v / 100) * (100 - PAD_TOP - PAD_BOTTOM);
    const toX = (i: number) => chartData.length <= 1 ? 50 : (i / (chartData.length - 1)) * 100;

    const svgPoints = chartData.map((p, i) => ({ x: toX(i), y: toY(p.value) }));
    const linePath = smoothPath(svgPoints);
    const firstX = svgPoints[0]?.x ?? 0;
    const lastX = svgPoints[svgPoints.length - 1]?.x ?? 100;
    const bottomY = 100 - PAD_BOTTOM;
    const areaPath = linePath ? `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z` : "";

    const hovered = hoveredIdx !== null ? chartData[hoveredIdx] : null;
    const hoveredSvgX = hoveredIdx !== null ? svgPoints[hoveredIdx]?.x : null;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || !svgPoints.length) return;
        const rect = svgRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        let nearest = 0, minDist = Infinity;
        svgPoints.forEach((p, i) => {
            const dist = Math.abs(p.x - pct);
            if (dist < minDist) { minDist = dist; nearest = i; }
        });
        setHoveredIdx(nearest);
    };

    // Pick 3 evenly-spaced X-axis labels
    const xLabelIndices = new Set([0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]);

    return (
        <div className="col-span-8 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
            <div className="flex justify-between items-center mb-md gap-md flex-wrap">
                <div>
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {cameraSummary
                            ? `Congestion Trend — ${cameraId}`
                            : metricsSummary
                                ? "Historical Congestion Trend"
                                : "Live Congestion Trend"}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">Congestion index (0–100) over time</p>
                </div>
                <div className="flex items-center gap-md flex-wrap justify-end">
                    <span className="flex items-center gap-xs text-xs text-on-surface-variant">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: lineColor }} />
                        Congestion Score
                    </span>
                    {latest && (
                        <span className="text-xs font-semibold" style={{ color: lineColor }}>
                            {latest.value}%{delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 flex gap-2 min-h-0">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between py-2 pr-1 text-right shrink-0">
                    {[...Y_TICKS].reverse().map((tick) => (
                        <span key={tick} className="text-[10px] text-on-surface-variant font-mono-data leading-none">
                            {tick}
                        </span>
                    ))}
                </div>

                {/* Chart + X-axis */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 relative rounded-lg bg-surface-container-low border border-white/5 overflow-hidden">
                        <svg
                            ref={svgRef}
                            className="absolute inset-0 h-full w-full cursor-crosshair"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredIdx(null)}
                        >
                            <defs>
                                <linearGradient id="cxAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                                    <stop offset="75%" stopColor={lineColor} stopOpacity="0.06" />
                                    <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Horizontal grid lines at Y-tick values */}
                            {Y_TICKS.map((tick) => (
                                <line key={tick}
                                    x1="0" x2="100"
                                    y1={toY(tick)} y2={toY(tick)}
                                    stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
                                />
                            ))}

                            {/* Area fill */}
                            {areaPath && <path d={areaPath} fill="url(#cxAreaGrad)" />}

                            {/* Smooth line */}
                            {linePath && (
                                <path d={linePath} fill="none"
                                    stroke={lineColor} strokeWidth="1.8"
                                    strokeLinejoin="round" strokeLinecap="round"
                                />
                            )}

                            {/* Hover cursor */}
                            {hoveredSvgX !== null && (
                                <line
                                    x1={hoveredSvgX} x2={hoveredSvgX}
                                    y1={PAD_TOP} y2={bottomY}
                                    stroke="rgba(255,255,255,0.25)" strokeWidth="0.7"
                                    strokeDasharray="2,1.5"
                                />
                            )}
                        </svg>

                        {/* Hover tooltip (HTML overlay — not distorted by SVG scaling) */}
                        {hovered && hoveredSvgX !== null && (
                            <div
                                className="absolute pointer-events-none bg-surface-container border border-white/15 rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap"
                                style={{
                                    left: `${clamp(hoveredSvgX, 8, 88)}%`,
                                    top: "10px",
                                    transform: "translateX(-50%)",
                                }}
                            >
                                <div className="text-[9px] text-on-surface-variant uppercase font-bold mb-0.5 tracking-wide">
                                    {hovered.label}
                                </div>
                                <div className="text-sm font-semibold" style={{ color: lineColor }}>
                                    {hovered.value}%
                                </div>
                            </div>
                        )}
                    </div>

                    {/* X-axis labels */}
                    <div className="relative h-5 mt-1">
                        {chartData.map((point, index) => {
                            if (!xLabelIndices.has(index)) return null;
                            const leftPct = toX(index);
                            return (
                                <span
                                    key={`xl-${index}`}
                                    className="absolute text-[10px] text-on-surface-variant font-mono-data"
                                    style={{ left: `${leftPct}%`, transform: "translateX(-50%)" }}
                                >
                                    {point.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
