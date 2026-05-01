import KPIRow from "@/components/analytics/KPIRow";
import CongestionIndexChart from "@/components/analytics/CongestionIndexChart";
import PeakHourChart from "@/components/analytics/PeakHourChart";
import CongestedSegmentsTable from "@/components/analytics/CongestedSegmentsTable";
import ComparisonPanel from "@/components/analytics/ComparisonPanel";
import DataCoveragePanel from "@/components/analytics/DataCoveragePanel";
import FABOverlay from "@/components/ui/FABOverlay";

export default function AnalyticsPage() {
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
            <button className="px-md py-1.5 text-body-sm font-medium text-on-surface bg-surface-container-highest rounded shadow-sm">
              Last 30 Days
            </button>
            <button className="px-md py-1.5 text-body-sm font-medium text-on-surface-variant hover:text-on-surface">
              Quarterly
            </button>
            <button className="px-md py-1.5 text-body-sm font-medium text-on-surface-variant hover:text-on-surface">
              Custom
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
        <PeakHourChart />
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
