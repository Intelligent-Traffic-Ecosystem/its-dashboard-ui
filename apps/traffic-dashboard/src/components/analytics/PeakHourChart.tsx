"use client";

import { useAnalyticsTrends } from "@/lib/hooks/useB3Backend";
import { type ReactNode, useMemo, useRef, useState } from "react";

interface PeakHourChartProps {
    cameraId: string;
    from: string;
    to: string;
}

type TrendPoint = { timestamp: string; label: string; vehicleCount: number };

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

function formatLabel(timestamp: string, rangeMs: number) {
    const date = new Date(timestamp);
    if (rangeMs <= 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const LINE_COLOR = "#34d399"; // emerald-400
const PAD_TOP = 8;
const PAD_BOTTOM = 4;

export default function PeakHourChart({ cameraId, from, to }: PeakHourChartProps) {
    const { data: trends, loading, error } = useAnalyticsTrends(cameraId, from, to);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const rangeMs = useMemo(() => Math.max(1, new Date(to).getTime() - new Date(from).getTime()), [from, to]);

    const chartData = useMemo((): TrendPoint[] => {
        if (!trends?.series?.length) return [];
        return trends.series.map((e) => ({
            timestamp: e.timestamp,
            label: formatLabel(e.timestamp, rangeMs),
            vehicleCount: e.vehicleCount ?? 0,
        }));
    }, [rangeMs, trends]);

    const maxValue = Math.max(1, ...chartData.map((p) => p.vehicleCount));
    // Round Y-axis max up to a clean number
    const yMax = Math.ceil(maxValue / 10) * 10;
    const yTicks = [0, Math.round(yMax * 0.25), Math.round(yMax * 0.5), Math.round(yMax * 0.75), yMax];

    const toY = (v: number) => PAD_TOP + (1 - v / yMax) * (100 - PAD_TOP - PAD_BOTTOM);
    const toX = (i: number) => chartData.length <= 1 ? 50 : (i / (chartData.length - 1)) * 100;

    const svgPoints = chartData.map((p, i) => ({ x: toX(i), y: toY(p.vehicleCount) }));
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

    const latest = chartData[chartData.length - 1];
    const xLabelIndices = new Set([0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]);

    const shell = (children: ReactNode) => (
        <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
            <div className="mb-md">
                <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">Traffic Volume Trend</h3>
                <p className="text-[11px] text-on-surface-variant">Vehicle count over time</p>
            </div>
            {children}
        </div>
    );

    if (loading) {
        return shell(
            <div className="flex-1 flex items-center justify-center">
                <span className="text-on-surface-variant text-sm">Loading trend data…</span>
            </div>
        );
    }

    if (error || !chartData.length) {
        return shell(
            <div className="flex-1 flex items-center justify-center">
                <span className="text-error text-sm">Unable to load trend data</span>
            </div>
        );
    }

    return shell(
        <>
            {/* Latest value badge */}
            {latest && (
                <div className="flex items-center gap-md mb-md flex-wrap">
                    <span className="flex items-center gap-xs text-xs text-on-surface-variant">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: LINE_COLOR }} />
                        Vehicles
                    </span>
                    <span className="text-xs font-semibold" style={{ color: LINE_COLOR }}>
                        {latest.vehicleCount} at {latest.label}
                    </span>
                </div>
            )}

            <div className="flex-1 flex gap-2 min-h-0">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between py-2 pr-1 text-right shrink-0">
                    {[...yTicks].reverse().map((tick) => (
                        <span key={tick} className="text-[10px] text-on-surface-variant font-mono-data leading-none">
                            {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
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
                                <linearGradient id="phAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={LINE_COLOR} stopOpacity="0.28" />
                                    <stop offset="75%" stopColor={LINE_COLOR} stopOpacity="0.05" />
                                    <stop offset="100%" stopColor={LINE_COLOR} stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Grid lines */}
                            {yTicks.map((tick) => (
                                <line key={tick}
                                    x1="0" x2="100"
                                    y1={toY(tick)} y2={toY(tick)}
                                    stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
                                />
                            ))}

                            {/* Area fill */}
                            {areaPath && <path d={areaPath} fill="url(#phAreaGrad)" />}

                            {/* Smooth line */}
                            {linePath && (
                                <path d={linePath} fill="none"
                                    stroke={LINE_COLOR} strokeWidth="1.8"
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

                        {/* Hover tooltip */}
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
                                <div className="text-sm font-semibold" style={{ color: LINE_COLOR }}>
                                    {hovered.vehicleCount} vehicles
                                </div>
                            </div>
                        )}
                    </div>

                    {/* X-axis labels */}
                    <div className="relative h-5 mt-1">
                        {chartData.map((point, index) => {
                            if (!xLabelIndices.has(index)) return null;
                            return (
                                <span
                                    key={`xl-${index}`}
                                    className="absolute text-[10px] text-on-surface-variant font-mono-data"
                                    style={{ left: `${toX(index)}%`, transform: "translateX(-50%)" }}
                                >
                                    {point.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
