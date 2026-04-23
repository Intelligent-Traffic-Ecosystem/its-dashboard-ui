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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Active Incidents"
        value={activeIncidents}
        trend={-12}
        trendLabel="vs yesterday"
        icon={<AlertTriangle size={18} />}
        accentColor="text-red-400"
      />
      <StatCard
        label="Critical Alerts"
        value={criticalIncidents}
        trend={0}
        trendLabel="unchanged"
        icon={<Gauge size={18} />}
        accentColor="text-orange-400"
      />
      <StatCard
        label="Avg Congestion"
        value={`${avgCongestion}%`}
        trend={8}
        trendLabel="vs 1h ago"
        icon={<Car size={18} />}
        accentColor="text-yellow-400"
      />
      <StatCard
        label="Resolved Today"
        value={resolvedToday}
        trend={5}
        trendLabel="vs yesterday"
        icon={<CheckCircle size={18} />}
        accentColor="text-emerald-400"
      />
    </div>
  );
}
