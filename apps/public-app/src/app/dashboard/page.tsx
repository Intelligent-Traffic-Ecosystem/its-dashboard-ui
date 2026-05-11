import { PageShell } from "@/components/layout/PageShell";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RoadSegmentsTable } from "@/components/dashboard/RoadSegmentsTable";
import { TrafficVolumeChart } from "@/components/dashboard/TrafficVolumeChart";
import { DashboardStaleBanner } from "@/components/dashboard/DashboardStaleBanner";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  getPublicTrafficMetrics,
  deriveStats,
  deriveSegments,
  deriveChartSamples,
} from "@/lib/backend-api";

export default async function DashboardPage() {
  const metrics = await getPublicTrafficMetrics();
  const stats = deriveStats(metrics);
  const segments = deriveSegments(metrics);
  const chartSamples = deriveChartSamples(metrics);

  return (
    <PageShell
      title="Traffic Overview"
      subtitle="Real-time conditions — Colombo Metropolitan Area"
      actions={<LiveIndicator />}
    >
      <div className="space-y-5">
        {/* Stale data warning — shows after 30s without update */}
        <DashboardStaleBanner />

        {/* KPI row */}
        <StatsRow stats={stats} />

        {/* Full-width live camera chart */}
        <TrafficVolumeChart samples={chartSamples} />

        {/* Camera segment status table */}
        <RoadSegmentsTable segments={segments} />
      </div>
    </PageShell>
  );
}
