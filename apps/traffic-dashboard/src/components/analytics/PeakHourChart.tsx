"use client";

import { useAnalyticsTrends } from "@/lib/hooks/useB3Backend";
import { useMemo } from "react";

interface PeakHourChartProps {
  cameraId: string;
  from: string;
  to: string;
}

export default function PeakHourChart({ cameraId, from, to }: PeakHourChartProps) {
  const { data: trends, loading, error } = useAnalyticsTrends(cameraId, from, to);

  const hourlyData = useMemo(() => {
    if (!trends || !trends.series) return [];

    // Group data by hour and calculate max congestion per hour
    const hourlyMap: Record<string, number> = {};

    trends.series.forEach((point) => {
      const date = new Date(point.timestamp);
      const hour = `${date.getHours().toString().padStart(2, "0")}:00`;

      if (!hourlyMap[hour]) {
        hourlyMap[hour] = point.congestionScore;
      } else {
        hourlyMap[hour] = Math.max(hourlyMap[hour], point.congestionScore);
      }
    });

    // Convert to array and normalize heights
    const hours = Object.entries(hourlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([hour, score]) => ({
        hour,
        score,
        height: Math.max((score / 100) * 100, 5),
      }));

    return hours;
  }, [trends]);

  if (loading) {
    return (
      <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-[400px]">
        <div className="mb-xl">
          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
            Peak Hour Distribution
          </h3>
          <p className="text-[11px] text-on-surface-variant">Volume per hourly segment</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-on-surface-variant">Loading trend data...</span>
        </div>
      </div>
    );
  }

  if (error || !hourlyData.length) {
    return (
      <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-[400px]">
        <div className="mb-xl">
          <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
            Peak Hour Distribution
          </h3>
          <p className="text-[11px] text-on-surface-variant">Volume per hourly segment</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-error">Unable to load trend data</span>
        </div>
      </div>
    );
  }

  const peakHourTime = trends?.peakHour?.timestamp
    ? new Date(trends.peakHour.timestamp).getHours().toString().padStart(2, "0") + ":00"
    : null;

  return (
    <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-[400px]">
      <div className="mb-xl">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          Peak Hour Distribution
        </h3>
        <p className="text-[11px] text-on-surface-variant">Congestion score per hourly segment</p>
        {trends?.trend && (
          <p className="text-[11px] text-secondary mt-1">
            Trend: <span className="font-semibold">{trends.trend.toUpperCase()}</span>
            {trends.percentageChange !== 0 && ` (${trends.percentageChange > 0 ? "+" : ""}${trends.percentageChange}%)`}
          </p>
        )}
      </div>

      <div className="flex-1 flex items-end gap-2 px-sm">
        {hourlyData.map((bar) => (
          <div
            key={bar.hour}
            className={`flex-1 rounded-t group relative transition-colors ${peakHourTime === bar.hour
                ? "bg-secondary hover:bg-secondary-container"
                : "bg-surface-variant hover:bg-secondary-container"
              }`}
            style={{ height: `${bar.height}%` }}
            title={`${bar.hour}: ${bar.score.toFixed(1)} congestion score`}
          >
            {peakHourTime === bar.hour && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-secondary font-bold">
                {bar.score.toFixed(0)}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-md px-sm text-[10px] text-on-surface-variant font-mono-data">
        {hourlyData.map((_, i) => {
          const index = Math.floor((i * hourlyData.length) / 4);
          return <span key={i}>{hourlyData[index]?.hour || ""}</span>;
        })}
      </div>
    </div>
  );
}
