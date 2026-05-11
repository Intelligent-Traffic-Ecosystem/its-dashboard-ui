import { Gauge, Car } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import type { DashboardStats } from "@/lib/backend-api";

interface StatsRowProps {
  stats: DashboardStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      <StatCard
        label="Avg Congestion"
        value={`${stats.avgCongestion}%`}
        trend={0}
        trendLabel="across network"
        icon={<Gauge size={18} />}
        accentColor="#F59E0B"
      />
      <StatCard
        label="Avg Speed"
        value={`${stats.avgSpeed} km/h`}
        trend={0}
        trendLabel="network average"
        icon={<Car size={18} />}
        accentColor="#22C55E"
      />
    </div>
  );
}
