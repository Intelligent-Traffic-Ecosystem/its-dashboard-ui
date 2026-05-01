import CriticalAlertBanner from "@/components/dashboard/CriticalAlertBanner";
import KPISummaryRow from "@/components/dashboard/KPISummaryRow";
import TrafficMap from "@/components/dashboard/TrafficMap";
import LiveEventFeed from "@/components/dashboard/LiveEventFeed";
import ChartPanel from "@/components/dashboard/ChartPanel";
import SystemActions from "@/components/dashboard/SystemActions";

export default function DashboardPage() {
  return (
    <main className="ml-64 h-[calc(100vh-3.5rem)] overflow-y-auto p-6 space-y-6 bg-surface-container-lowest">
      <CriticalAlertBanner />
      <KPISummaryRow />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 space-y-gutter">
          <TrafficMap />
          <LiveEventFeed />
        </div>
        <div className="lg:col-span-4 space-y-gutter">
          <ChartPanel />
          <SystemActions />
        </div>
      </div>
    </main>
  );
}
