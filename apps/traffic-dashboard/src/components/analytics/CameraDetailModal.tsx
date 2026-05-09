"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useAnalyticsSummary, useAnalyticsTrends } from "@/lib/hooks/useB3Backend";
import { b3Backend } from "@/lib/b3-backend";

interface Props {
    cameraId: string;
    open: boolean;
    onClose: () => void;
}

export default function CameraDetailModal({ cameraId, open, onClose }: Props) {
    const [timePeriod, setTimePeriod] = useState<"1h" | "6h" | "24h">("6h");

    const { from, to, periodLabel } = useMemo(() => {
        const now = new Date();
        const hours = timePeriod === "1h" ? 1 : timePeriod === "24h" ? 24 : 6;

        return {
            from: new Date(now.getTime() - 1000 * 60 * 60 * hours).toISOString(),
            to: now.toISOString(),
            periodLabel: `${hours} hour${hours === 1 ? "" : "s"}`,
        };
    }, [cameraId, timePeriod]);

    const { data: summary, loading: sumLoading } = useAnalyticsSummary(cameraId, from, to);
    const { data: trends, loading: trendsLoading } = useAnalyticsTrends(cameraId, from, to);

    const [location, setLocation] = useState<{ lat?: number; lng?: number; name?: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const pts = await b3Backend.locations.listAll();
                const found = pts.find((p: any) => (p.cameraId ?? p.camera_id) === cameraId);
                if (!cancelled && found) {
                    setLocation({ lat: found.latitude ?? found.lat, lng: found.longitude ?? found.lng, name: found.cameraId ?? found.camera_id });
                }
            } catch {
                // ignore
            }
        })();
        return () => { cancelled = true; };
    }, [cameraId]);

    const countsByClass = useMemo(() => {
        if (!summary || !summary.series) return {} as Record<string, number>;
        return summary.series.reduce((acc: Record<string, number>, p: any) => {
            if (p.countsByClass) {
                Object.entries(p.countsByClass).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + (v as number); });
            } else if (p.vehicleCount) {
                acc['total'] = (acc['total'] || 0) + p.vehicleCount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [summary]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-surface-container border border-white/10 rounded-lg w-350 max-w-[98%] max-h-[95vh] overflow-y-auto p-lg">
                <div className="flex justify-between items-start mb-md sticky top-0 bg-surface-container pb-md border-b border-white/5 z-10">
                    <div className="flex-1">
                        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">Camera: {cameraId}</h3>
                        <div className="flex flex-wrap gap-md items-center mt-1">
                            <p className="text-[12px] text-on-surface-variant">{location ? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : 'Location: unknown'}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-on-surface-variant uppercase font-bold">Period</span>
                                <select
                                    value={timePeriod}
                                    onChange={(event) => setTimePeriod(event.target.value as "1h" | "6h" | "24h")}
                                    className="bg-surface-container-low border border-white/10 rounded px-2 py-1 text-[11px] text-on-surface"
                                >
                                    <option value="1h">Last 1 Hour</option>
                                    <option value="6h">Last 6 Hours</option>
                                    <option value="24h">Last 24 Hours</option>
                                </select>
                            </div>
                            <p className="text-[11px] text-on-surface-variant">Overview: {periodLabel}</p>
                            <a
                                href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alerts/export?camera_id=${encodeURIComponent(cameraId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-primary hover:text-primary-container underline"
                            >
                                Export CSV
                            </a>
                        </div>
                    </div>
                    <button className="px-md py-sm bg-surface-variant rounded hover:bg-surface-container-highest transition-colors text-sm" onClick={onClose}>Close</button>
                </div>

                <div className="grid grid-cols-3 gap-lg">
                    <div className="col-span-2">
                        <div className="mb-lg">
                            <h4 className="font-semibold text-sm mb-md">Overview</h4>
                            {sumLoading ? <p className="text-on-surface-variant">Loading...</p> : (
                                <div className="grid grid-cols-3 gap-md">
                                    <div className="bg-surface-container-low rounded p-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Avg Speed</div>
                                        <div className="font-bold text-xl mt-1">{summary ? `${summary.averageSpeedKmh.toFixed(1)} km/h` : '—'}</div>
                                    </div>
                                    <div className="bg-surface-container-low rounded p-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Total Vehicles</div>
                                        <div className="font-bold text-xl mt-1">{summary ? summary.totalVehicles : '—'}</div>
                                    </div>
                                    <div className="bg-surface-container-low rounded p-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Peak Hour</div>
                                        <div className="font-bold text-xs mt-1">{summary && summary.peakWindow ? `${new Date(summary.peakWindow.windowStart || summary.peakWindow.windowEnd || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 className="font-semibold text-sm mb-md">Vehicle Distribution by Category</h4>
                            {trendsLoading || sumLoading ? (
                                <p className="text-on-surface-variant">Loading counts...</p>
                            ) : (
                                <div>
                                    {Object.keys(countsByClass).length === 0 ? (
                                        <div className="text-on-surface-variant">No category counts available</div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-md">
                                            <div className="flex gap-4">
                                                {Object.entries(countsByClass).map(([k, v]) => (
                                                    <div key={k} className="flex-1">
                                                        <div className="text-[11px] text-on-surface-variant font-bold uppercase mb-1">{k}</div>
                                                        <div className="bg-surface-variant rounded h-6 mb-1">
                                                            <div className="bg-primary h-6 rounded" style={{ width: `${Math.min(100, (v / Math.max(1, Object.values(countsByClass).reduce((s, x) => s + x, 0))) * 100)}%` }} />
                                                        </div>
                                                        <div className="text-sm font-mono-data text-on-surface">{v}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="bg-surface-container-low rounded p-md">
                                                <h5 className="text-[11px] font-bold mb-md">Category Summary</h5>
                                                {Object.entries(countsByClass).map(([k, v]) => {
                                                    const pct = ((v / Object.values(countsByClass).reduce((s, x) => s + x, 0)) * 100).toFixed(1);
                                                    return (
                                                        <div key={k} className="flex justify-between text-[11px] mb-1">
                                                            <span className="text-on-surface-variant">{k}</span>
                                                            <span className="font-mono-data">{v} ({pct}%)</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-surface-container-low rounded p-md h-fit">
                        <h4 className="font-semibold text-sm mb-md">Peak Time Analysis</h4>
                        {trendsLoading ? <p className="text-on-surface-variant text-[11px]">Loading...</p> : (
                            <div className="space-y-md">
                                {trends && trends.peakHour ? (
                                    <div className="border-l-2 border-secondary pl-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Peak Hour</div>
                                        <div className="font-bold text-sm">{new Date(trends.peakHour.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-[11px] text-on-surface-variant mt-1">
                                            {trends.peakHour.vehicleCount} vehicles
                                        </div>
                                        <div className="text-[11px] text-on-surface-variant">
                                            {trends.peakHour.averageSpeedKmh.toFixed(1)} km/h
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-on-surface-variant text-[11px]">No peak data</div>
                                )}
                                {trends && trends.lowestCongestionWindow ? (
                                    <div className="border-l-2 border-success pl-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Lowest Congestion</div>
                                        <div className="font-bold text-sm">{new Date(trends.lowestCongestionWindow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-[11px] text-on-surface-variant mt-1">
                                            {trends.lowestCongestionWindow.vehicleCount} vehicles
                                        </div>
                                    </div>
                                ) : null}
                                {trends?.trend && (
                                    <div className="border-t border-white/5 pt-md">
                                        <div className="text-[10px] text-on-surface-variant uppercase font-bold">Trend</div>
                                        <div className="text-sm font-semibold text-secondary mt-1">
                                            {trends.trend.toUpperCase()}
                                            {trends.percentageChange !== 0 && ` (${trends.percentageChange > 0 ? "+" : ""}${trends.percentageChange}%)`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
