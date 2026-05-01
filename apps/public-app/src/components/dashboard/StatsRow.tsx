// TODO: Replace networkStats dummy data with:
// const data = await fetch('/api/network-stats') via B4 Kong gateway
// Data comes from B2 Apache Flink real-time computation

import { AlertTriangle, Car, CheckCircle, Gauge } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { INCIDENTS, ROAD_SEGMENTS } from "@/lib/dummy-data";

export function StatsRow() {
  const activeIncidents = INCIDENTS.filter((i) => i.status === "active").length;
  const criticalIncidents = INCIDENTS.filter(
    (i) => i.severity === "critical" && i.status === "active"
  ).length;
  const resolvedToday = INCIDENTS.filter((i) => i.status === "resolved").length;
  const avgCongestion = Math.round(
    ROAD_SEGMENTS.reduce((sum, r) => sum + r.congestionPct, 0) /
      ROAD_SEGMENTS.length
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        label="Active Incidents"
        value={activeIncidents}
        trend={-12}
        trendLabel="vs yesterday"
        icon={<AlertTriangle size={18} />}
        accentColor="#EF4444"
      />
      <StatCard
        label="Critical Alerts"
        value={criticalIncidents}
        trend={0}
        trendLabel="unchanged"
        icon={<Gauge size={18} />}
        accentColor="#D16900"
      />
      <StatCard
        label="Avg Congestion"
        value={`${avgCongestion}%`}
        trend={8}
        trendLabel="vs 1h ago"
        icon={<Car size={18} />}
        accentColor="#F59E0B"
      />
      <StatCard
        label="Resolved Today"
        value={resolvedToday}
        trend={5}
        trendLabel="vs yesterday"
        icon={<CheckCircle size={18} />}
        accentColor="#22C55E"
      />
    </div>
  );
}
