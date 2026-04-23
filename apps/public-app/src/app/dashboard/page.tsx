import { PageShell } from "@/components/layout/PageShell";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RoadSegmentsTable } from "@/components/dashboard/RoadSegmentsTable";
import { TrafficVolumeChart } from "@/components/dashboard/TrafficVolumeChart";
import { RecentIncidents } from "@/components/dashboard/RecentIncidents";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

export default function DashboardPage() {
  return (
    <PageShell
      title="Traffic Overview"
      subtitle="Real-time system status across all monitored corridors"
      actions={<LiveIndicator />}
    >
      <div className="space-y-6">
        {/* KPI row */}
        <StatsRow />

        {/* Chart + incidents split */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <TrafficVolumeChart />
          </div>
          <div className="xl:col-span-2">
            <RecentIncidents />
          </div>
        </div>

        {/* Road segments table */}
        <RoadSegmentsTable />
      </div>
    </PageShell>
  );
}
