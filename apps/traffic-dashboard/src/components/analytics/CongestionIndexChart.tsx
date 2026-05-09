"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalyticsMetrics, AnalyticsSummary } from "@/lib/b3-backend";
import { getSocket, type TrafficMetric } from "@/lib/socket";

interface CongestionIndexChartProps {
    cameraId?: string;
    metricsSummary?: AnalyticsMetrics | null;
    cameraSummary?: AnalyticsSummary | null;
}

type ChartPoint = {
    label: string;
    value: number;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function buildPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export default function CongestionIndexChart({ cameraId, metricsSummary, cameraSummary }: CongestionIndexChartProps) {
    const [liveTrail, setLiveTrail] = useState<ChartPoint[]>([]);

    useEffect(() => {
        setLiveTrail([]);
    }, [cameraId]);

    useEffect(() => {
        const socket = getSocket();

        const onCongestion = (data: TrafficMetric[]) => {
            if (!cameraId) return;

            const metric = data.find((item) => item.cameraId === cameraId);
            if (!metric) return;

            const label = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const point: ChartPoint = {
                label,
                value: Math.round(metric.congestionScore * 100),
            };

            setLiveTrail((prev) => [...prev.slice(-59), point]);
        };

        socket.on("traffic:congestion", onCongestion);
        return () => {
            socket.off("traffic:congestion", onCongestion);
        };
    }, [cameraId]);

    const chartData: ChartPoint[] = useMemo(() => {
        if (cameraSummary?.series.length) {
            return cameraSummary.series.map((entry) => ({
                label: entry.windowEnd
                    ? new Date(entry.windowEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "—",
                value: Math.round(clamp(entry.congestionScore * 100, 0, 100)),
            }));
        }

        if (metricsSummary?.peak_hour_distribution.length) {
            return metricsSummary.peak_hour_distribution.map((entry) => ({
                label: `${String(entry.hour).padStart(2, "0")}:00`,
                value: Math.round(clamp(entry.avg_congestion_score * 100, 0, 100)),
            }));
        }

        if (liveTrail.length) {
            return liveTrail;
        }

        return [40, 55, 45, 70, 65, 30, 50, 85, 60, 40].map((value, index) => ({
            label: `${index + 1}`,
            value,
        }));
    }, [cameraSummary, liveTrail, metricsSummary]);

    const maxValue = Math.max(100, ...chartData.map((point) => point.value), 1);
    const minValue = Math.min(...chartData.map((point) => point.value), 0);
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2] ?? latest;
    const delta = latest && previous ? latest.value - previous.value : 0;
    const trendClass = delta > 0 ? "text-error" : delta < 0 ? "text-success" : "text-on-surface-variant";
    const strokeClass = delta > 0 ? "text-error" : delta < 0 ? "text-success" : "text-primary";

    const svgPoints = chartData.map((point, index) => {
        const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / Math.max(1, maxValue - minValue)) * 78 - 10;
        return { x, y };
    });

    const linePath = buildPath(svgPoints);
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    return (
        <div className="col-span-8 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
            <div className="flex justify-between items-center mb-xl gap-md flex-wrap">
                <div>
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        {cameraSummary
                            ? `Congestion Trend — ${cameraId}`
                            : metricsSummary
                                ? "Historical Congestion Trend"
                                : "Live Congestion Trend"}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                        Stock-style line graph with smooth updates
                    </p>
                </div>

                <div className="flex items-center gap-md flex-wrap justify-end">
                    <span className="flex items-center gap-xs text-xs text-on-surface-variant">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        Congestion Score
                    </span>
                    <span className={`text-xs font-semibold ${trendClass}`}>
                        {latest ? `${latest.value}%` : "—"}
                        {delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
                    </span>
                </div>
            </div>

            <div className="flex-1 relative rounded-xl bg-surface-container-low border border-white/5 overflow-hidden">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                        <linearGradient id="congestionArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {[20, 40, 60, 80].map((line) => (
                        <line key={line} x1="0" x2="100" y1={line} y2={line} className="stroke-white/8" strokeWidth="0.5" />
                    ))}

                    {linePath && (
                        <path d={areaPath} className={`fill-current ${strokeClass}`} style={{ transition: "all 250ms ease" }} />
                    )}

                    {linePath && (
                        <path
                            d={linePath}
                            fill="none"
                            className={`stroke-current ${strokeClass}`}
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            style={{ transition: "all 250ms ease" }}
                        />
                    )}

                    {svgPoints.map((point, index) => {
                        const isLatest = index === svgPoints.length - 1;
                        return (
                            <circle
                                key={`${point.x}-${point.y}-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={isLatest ? 1.6 : 0.8}
                                className={isLatest ? `fill-current ${strokeClass}` : "fill-white/70"}
                            />
                        );
                    })}
                </svg>

                <div className="absolute inset-x-0 bottom-0 flex justify-between px-md py-sm text-[10px] text-on-surface-variant font-mono-data uppercase">
                    {chartData.map((point, index) => {
                        const shouldShow =
                            index === 0 ||
                            index === chartData.length - 1 ||
                            index === Math.floor(chartData.length / 2) ||
                            (chartData.length > 10 && index % Math.ceil(chartData.length / 4) === 0);

                        if (!shouldShow) {
                            return <span key={`${point.label}-${index}`} className="opacity-0">.</span>;
                        }

                        return <span key={`${point.label}-${index}`}>{point.label}</span>;
                    })}
                </div>

                {latest && (
                    <div className="absolute top-3 right-3 bg-surface-container/90 border border-white/10 rounded-lg px-3 py-2 shadow-md">
                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Latest</div>
                        <div className={`text-sm font-semibold ${strokeClass}`}>{latest.value}%</div>
                    </div>
                )}
            </div>
        </div>
    );
}