"use client";

import { useState, useMemo } from "react";
import KPIRow from "@/components/analytics/KPIRow";
import CongestionIndexChart from "@/components/analytics/CongestionIndexChart";
import PeakHourChart from "@/components/analytics/PeakHourChart";
import CongestedSegmentsTable from "@/components/analytics/CongestedSegmentsTable";
import ComparisonPanel from "@/components/analytics/ComparisonPanel";
import DataCoveragePanel from "@/components/analytics/DataCoveragePanel";
import FABOverlay from "@/components/ui/FABOverlay";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last30days");
  const [selectedCamera, setSelectedCamera] = useState("CAM-001");

  // Calculate date range based on selected option
  const { from, to } = useMemo(() => {
    const now = new Date();
    let fromDate: Date;

    switch (timeRange) {
      case "last7days":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "quarterly":
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
      default:
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      from: fromDate.toISOString(),
      to: now.toISOString(),
    };
  }, [timeRange]);

  return (
    <main className="ml-64 p-margin pt-sm">
      <header className="flex justify-between items-end mb-lg">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-semibold tracking-[-0.02em]">
            Historical Analytics
          </h1>
          <p className="text-on-surface-variant text-body-sm">
            Deep-dive performance metrics for District 4 Regional Network
          </p>
        </div>
        <div className="flex items-center gap-md">
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
          <button className="flex items-center gap-xs bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-semibold text-title-sm hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            PDF Export
          </button>
        </div>
      </header>

      <KPIRow />

      <div className="grid grid-cols-12 gap-gutter mb-lg">
        <CongestionIndexChart />
        <PeakHourChart cameraId={selectedCamera} from={from} to={to} />
      </div>

      <div className="grid grid-cols-12 gap-gutter">
        <CongestedSegmentsTable />
        <div className="col-span-12 lg:col-span-3 space-y-gutter">
          <ComparisonPanel />
          <DataCoveragePanel />
        </div>
      </div>

      <FABOverlay />
    </main>
  );
}
