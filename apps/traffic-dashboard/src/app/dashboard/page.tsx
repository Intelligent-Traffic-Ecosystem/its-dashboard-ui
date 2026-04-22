import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import CriticalAlertBanner from "@/components/dashboard/CriticalAlertBanner";
import KPISummaryRow from "@/components/dashboard/KPISummaryRow";
import TrafficMap from "@/components/dashboard/TrafficMap";
import LiveEventFeed from "@/components/dashboard/LiveEventFeed";
import ChartPanel from "@/components/dashboard/ChartPanel";
import SystemActions from "@/components/dashboard/SystemActions";

export default function DashboardPage() {
  return (
    <>
      <TopNavBar />
      <SideNavBar />

      {/* Full-height scrollable content area offset by TopNavBar (h-14 = 3.5rem) */}
      <main className="ml-64 h-[calc(100vh-3.5rem)] overflow-y-auto p-6 space-y-6 bg-surface-container-lowest">
        {/* Critical Alert */}
        <CriticalAlertBanner />

        {/* KPI row */}
        <KPISummaryRow />

        {/* Main 8/4 grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left: map + feed */}
          <div className="lg:col-span-8 space-y-gutter">
            <TrafficMap />
            <LiveEventFeed />
          </div>

          {/* Right: charts + actions */}
          <div className="lg:col-span-4 space-y-gutter">
            <ChartPanel />
            <SystemActions />
          </div>
        </div>
      </main>
    </>
  );
}
