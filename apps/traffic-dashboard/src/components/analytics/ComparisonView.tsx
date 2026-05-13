"use client";

import React, { useState, useMemo } from "react";
import { useAnalyticsComparison } from "@/lib/hooks/useB3Backend";

interface Props {
    onClose?: () => void;
}

const DeltaIndicator = ({ delta, label }: { delta: number; label: string }) => {
    const isPositive = delta > 0;
    const color = isPositive ? "text-error" : "text-success";
    const icon = isPositive ? "↑" : "↓";
    return (
        <div className={`text-sm font-semibold ${color}`}>
            {icon} {Math.abs(delta).toFixed(1)}% {label}
        </div>
    );
};

export default function ComparisonView({ onClose }: Props) {
    // Default Range A = last 24 h, Range B = 24–48 h ago (within seeded data window)
    const [aFrom, setAFrom] = useState(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [aTo, setATo] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [bFrom, setBFrom] = useState(
        new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [bTo, setBTo] = useState(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );

    const { data: comparison, loading, error } = useAnalyticsComparison(
        `${aFrom}T00:00:00Z`,
        `${aTo}T23:59:59Z`,
        `${bFrom}T00:00:00Z`,
        `${bTo}T23:59:59Z`
    );

    const comparisonMetrics = useMemo(() => {
        if (!comparison) return null;

        const a = comparison.range_a;
        const b = comparison.range_b;

        const congestionDelta = ((a.avg_congestion_score - b.avg_congestion_score) / b.avg_congestion_score) * 100;

        return {
            congestionDelta,
            rangeALabel: `${new Date(a.range_start).toLocaleDateString()} - ${new Date(a.range_end).toLocaleDateString()}`,
            rangeBLabel: `${new Date(b.range_start).toLocaleDateString()} - ${new Date(b.range_end).toLocaleDateString()}`,
            a,
            b,
        };
    }, [comparison]);

    return (
        <div className="w-full">
            {/* Filter controls */}
            <div className="mb-lg p-md bg-surface-container-low rounded-lg">
                <h3 className="font-semibold mb-md">Compare Date Ranges</h3>
                <div className="grid grid-cols-4 gap-md">
                    <div>
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold">Range A: From</label>
                        <input
                            type="date"
                            value={aFrom}
                            onChange={(e) => setAFrom(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-container border border-white/10 rounded text-on-surface text-sm mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold">Range A: To</label>
                        <input
                            type="date"
                            value={aTo}
                            onChange={(e) => setATo(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-container border border-white/10 rounded text-on-surface text-sm mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold">Range B: From</label>
                        <input
                            type="date"
                            value={bFrom}
                            onChange={(e) => setBFrom(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-container border border-white/10 rounded text-on-surface text-sm mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant uppercase font-bold">Range B: To</label>
                        <input
                            type="date"
                            value={bTo}
                            onChange={(e) => setBTo(e.target.value)}
                            className="w-full px-2 py-1 bg-surface-container border border-white/10 rounded text-on-surface text-sm mt-1"
                        />
                    </div>
                </div>
            </div>

            {loading && <p className="text-on-surface-variant">Loading comparison...</p>}
            {error && <p className="text-error">Failed to load comparison data</p>}

            {comparisonMetrics && (
                <div className="grid grid-cols-2 gap-lg">
                    {/* Range A */}
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <h4 className="font-semibold text-sm mb-md">{comparisonMetrics.rangeALabel}</h4>
                        <div className="space-y-md">
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Avg Congestion Score</div>
                                <div className="font-bold text-2xl text-primary">{comparisonMetrics.a.avg_congestion_score.toFixed(1)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Top Segment</div>
                                <div className="text-sm font-mono-data">{comparisonMetrics.a.top_segments[0]?.camera_id ?? "—"}</div>
                                <div className="text-xs text-on-surface-variant">{comparisonMetrics.a.top_segments[0]?.road_segment}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Peak Hour</div>
                                <div className="text-sm font-mono-data">
                                    {comparisonMetrics.a.peak_hour_distribution && comparisonMetrics.a.peak_hour_distribution.length > 0
                                        ? `${comparisonMetrics.a.peak_hour_distribution[0].hour}:00 (${comparisonMetrics.a.peak_hour_distribution[0].avg_vehicle_count} vehicles)`
                                        : "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Range B */}
                    <div className="bg-surface-container border border-white/10 rounded-lg p-lg">
                        <h4 className="font-semibold text-sm mb-md">{comparisonMetrics.rangeBLabel}</h4>
                        <div className="space-y-md">
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Avg Congestion Score</div>
                                <div className="font-bold text-2xl text-secondary">{comparisonMetrics.b.avg_congestion_score.toFixed(1)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Top Segment</div>
                                <div className="text-sm font-mono-data">{comparisonMetrics.b.top_segments[0]?.camera_id ?? "—"}</div>
                                <div className="text-xs text-on-surface-variant">{comparisonMetrics.b.top_segments[0]?.road_segment}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-on-surface-variant uppercase font-bold">Peak Hour</div>
                                <div className="text-sm font-mono-data">
                                    {comparisonMetrics.b.peak_hour_distribution && comparisonMetrics.b.peak_hour_distribution.length > 0
                                        ? `${comparisonMetrics.b.peak_hour_distribution[0].hour}:00 (${comparisonMetrics.b.peak_hour_distribution[0].avg_vehicle_count} vehicles)`
                                        : "—"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deltas */}
                    <div className="col-span-2 bg-surface-container-low rounded-lg p-lg">
                        <h4 className="font-semibold text-sm mb-md">Differences (Range A vs B)</h4>
                        <div className="grid grid-cols-3 gap-md">
                            <DeltaIndicator delta={comparisonMetrics.congestionDelta} label="Congestion" />
                            <div className="text-sm">
                                <div className="text-on-surface-variant text-[10px] uppercase font-bold">Incidents Δ</div>
                                <div className="text-lg font-semibold">
                                    {comparisonMetrics.a.incident_pie.reduce((s, x) => s + x.count, 0) -
                                        comparisonMetrics.b.incident_pie.reduce((s, x) => s + x.count, 0)}
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-on-surface-variant text-[10px] uppercase font-bold">Segments Analyzed</div>
                                <div className="text-lg font-semibold">{comparisonMetrics.a.top_segments.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
