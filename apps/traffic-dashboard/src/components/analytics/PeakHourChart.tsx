"use client";

import { useAnalyticsTrends } from "@/lib/hooks/useB3Backend";
import { useMemo } from "react";

interface PeakHourChartProps {
    cameraId: string;
    from: string;
    to: string;
}

type TrendPoint = {
    timestamp: string;
    label: string;
    vehicleCount: number;
};

function buildPath(points: Array<{ x: number; y: number }>) {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

function formatLabel(timestamp: string, rangeMs: number) {
    const date = new Date(timestamp);
    if (rangeMs <= 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function PeakHourChart({ cameraId, from, to }: PeakHourChartProps) {
    const { data: trends, loading, error } = useAnalyticsTrends(cameraId, from, to);

    const rangeMs = useMemo(() => Math.max(1, new Date(to).getTime() - new Date(from).getTime()), [from, to]);

    const chartData: TrendPoint[] = useMemo(() => {
        if (!trends?.series?.length) return [];

        return trends.series.map((entry) => ({
            timestamp: entry.timestamp,
            label: formatLabel(entry.timestamp, rangeMs),
            vehicleCount: entry.vehicleCount ?? 0,
        }));
    }, [rangeMs, trends]);

    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2] ?? latest;
    const delta = latest && previous ? latest.vehicleCount - previous.vehicleCount : 0;
    const maxValue = Math.max(1, ...chartData.map((point) => point.vehicleCount));
    const svgPoints = chartData.map((point, index) => {
        const x = chartData.length === 1 ? 0 : (index / (chartData.length - 1)) * 100;
        const y = 100 - (point.vehicleCount / maxValue) * 76 - 12;
        return { x, y };
    });
    const linePath = buildPath(svgPoints);
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;

    if (loading) {
        return (
            <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
                <div className="mb-xl">
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        Traffic Volume Trend
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">Vehicle count over time as a continuous line</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-on-surface-variant">Loading trend data...</span>
                </div>
            </div>
        );
    }

    if (error || !chartData.length) {
        return (
            <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
                <div className="mb-xl">
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        Traffic Volume Trend
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">Vehicle count over time as a continuous line</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-error">Unable to load trend data</span>
                </div>
            </div>
        );
    }

    return (
        <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-100">
            <div className="mb-xl flex items-start justify-between gap-md">
                <div>
                    <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
                        Traffic Volume Trend
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">Continuous vehicle-count line. Hover a point for exact values.</p>
                </div>
                {latest && (
                    <div className="text-right">
                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Latest</div>
                        <div className="text-sm font-semibold text-on-surface">{latest.vehicleCount} vehicles</div>
                    </div>
                )}
            </div>

            <div className="flex-1 relative rounded-xl bg-surface-container-low border border-white/5 overflow-hidden">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {[20, 40, 60, 80].map((line) => (
                        <line key={line} x1="0" x2="100" y1={line} y2={line} className="stroke-white/8" strokeWidth="0.5" />
                    ))}

                    {linePath && <path d={areaPath} className="fill-primary/15" />}
                    {linePath && (
                        <path
                            d={linePath}
                            fill="none"
                            className="stroke-primary"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.12))" }}
                        />
                    )}

                    {svgPoints.map((point, index) => {
                        const isLatest = index === svgPoints.length - 1;
                        return (
                            <circle
                                key={`${chartData[index].timestamp}-${index}`}
                                cx={point.x}
                                cy={point.y}
                                r={isLatest ? 1.4 : 0.85}
                                className={isLatest ? "fill-primary" : "fill-white/70"}
                            >
                                <title>{`${chartData[index].label}: ${chartData[index].vehicleCount} vehicles`}</title>
                            </circle>
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
                            return <span key={`${point.timestamp}-${index}`} className="opacity-0">.</span>;
                        }

                        return <span key={`${point.timestamp}-${index}`}>{point.label}</span>;
                    })}
                </div>

                {latest && (
                    <div className="absolute top-3 right-3 bg-surface-container/90 border border-white/10 rounded-lg px-3 py-2 shadow-md">
                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Latest</div>
                        <div className="text-sm font-semibold text-primary">{latest.vehicleCount} vehicles</div>
                        {delta !== 0 && (
                            <div className={`text-[10px] font-semibold ${delta > 0 ? "text-error" : "text-success"}`}>
                                {delta > 0 ? "+" : ""}{delta} vs previous point
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}