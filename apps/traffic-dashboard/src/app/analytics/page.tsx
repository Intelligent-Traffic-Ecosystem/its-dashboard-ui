"use client";

import { useMemo, useState } from "react";
import KPIRow from "@/components/analytics/KPIRow";
import CongestionIndexChart from "@/components/analytics/CongestionIndexChart";
import PeakHourChart from "@/components/analytics/PeakHourChart";
import CongestedSegmentsTable from "@/components/analytics/CongestedSegmentsTable";
import ComparisonPanel from "@/components/analytics/ComparisonPanel";
import DataCoveragePanel from "@/components/analytics/DataCoveragePanel";
import FABOverlay from "@/components/ui/FABOverlay";
import { b3Backend } from "@/lib/b3-backend";
import {
  useAnalyticsComparison,
  useAnalyticsMetrics,
  useAnalyticsSummary,
  useB3Health,
  useCurrentCongestion,
} from "@/lib/hooks/useB3Backend";

type TimeRange = "last7days" | "last30days" | "quarterly";

function getRange(timeRange: TimeRange) {
  const now = new Date();
  const days = timeRange === "last7days" ? 7 : timeRange === "quarterly" ? 90 : 30;
  return {
    from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
    days,
  };
}

function getPreviousRange(from: string, days: number) {
  const end = new Date(from);
  return {
    from: new Date(end.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
    to: end.toISOString(),
  };
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("last30days");
  const { data: currentMetrics } = useCurrentCongestion();

  const cameras = useMemo(
    () => Array.from(new Set((currentMetrics ?? []).map((metric) => metric.cameraId))).sort(),
    [currentMetrics]
  );
  const [selectedCamera, setSelectedCamera] = useState("CAM-001");
  const effectiveCamera = cameras.includes(selectedCamera) ? selectedCamera : cameras[0] ?? selectedCamera;

  const { from, to, days } = useMemo(() => getRange(timeRange), [timeRange]);
  const previous = useMemo(() => getPreviousRange(from, days), [days, from]);
  const { data: analyticsSummary } = useAnalyticsSummary(effectiveCamera, from, to);
  const { data: metricsSummary } = useAnalyticsMetrics(from, to);
  const { data: comparison } = useAnalyticsComparison(from, to, previous.from, previous.to);
  const { data: health } = useB3Health();

  const exportPdf = () => {
    window.location.href = b3Backend.analytics.getReportPdfUrl(from, to);
  };

  return (
    <main className="ml-64 p-margin pt-sm">
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-semibold tracking-[-0.02em]">
            Historical Analytics
          </h1>
          <p className="text-on-surface-variant text-body-sm">
            B3 historical metrics from the B2 traffic data API through the dashboard backend
          </p>
        </div>
        <div className="flex items-center gap-md">
          <select
            className="bg-surface-container border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface outline-none"
            value={effectiveCamera}
            onChange={(event) => setSelectedCamera(event.target.value)}
          >
            {cameras.length === 0 && <option value={effectiveCamera}>{effectiveCamera}</option>}
            {cameras.map((cameraId) => (
              <option key={cameraId} value={cameraId}>{cameraId}</option>
            ))}
          </select>
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg p-1">
            <button
              onClick={() => setTimeRange("last30days")}
              className={`px-md py-1.5 text-body-sm font-medium rounded transition-colors ${timeRange === "last30days"
                  ? "text-on-surface bg-surface-container-highest shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange("last7days")}
              className={`px-md py-1.5 text-body-sm font-medium rounded transition-colors ${timeRange === "last7days"
                  ? "text-on-surface bg-surface-container-highest shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange("quarterly")}
              className={`px-md py-1.5 text-body-sm font-medium rounded transition-colors ${timeRange === "quarterly"
                  ? "text-on-surface bg-surface-container-highest shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Quarterly
            </button>
          </div>
          <button
            className="flex items-center gap-xs bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-semibold text-title-sm hover:opacity-90 transition-opacity"
            onClick={exportPdf}
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            PDF Export
          </button>
        </div>
      </header>

      <KPIRow health={health} metricsSummary={metricsSummary} summary={analyticsSummary} />

      <div className="grid grid-cols-12 gap-gutter mb-lg">
        <CongestionIndexChart metricsSummary={metricsSummary} />
        <PeakHourChart cameraId={effectiveCamera} from={from} to={to} />
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <CongestedSegmentsTable metricsSummary={metricsSummary} />
        <div className="col-span-12 lg:col-span-3 space-y-gutter">
          <ComparisonPanel comparison={comparison} />
          <DataCoveragePanel cameraCount={cameras.length || 1} summary={analyticsSummary} />
        </div>
      </div>

      <FABOverlay />
    </main>
  );
}
