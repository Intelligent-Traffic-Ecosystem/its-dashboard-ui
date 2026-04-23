import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  accentColor = "text-cyan-400",
}: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = (trend ?? 0) > 0;
  const isNeutral = trend === 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-5 flex flex-col gap-3">
      {/* accent line */}
      <div className={`absolute top-0 left-0 h-0.5 w-full ${accentColor.replace("text-", "bg-")}`} />

      <div className="flex items-start justify-between">
        <p className="text-sm text-zinc-400 font-medium">{label}</p>
        {icon && (
          <span className={`${accentColor}`}>{icon}</span>
        )}
      </div>

      <p className={`text-3xl font-bold tabular-nums ${accentColor}`}>{value}</p>

      {hasTrend && (
        <div className="flex items-center gap-1.5 text-xs">
          {isNeutral ? (
            <Minus size={13} className="text-zinc-500" />
          ) : isPositive ? (
            <TrendingUp size={13} className="text-emerald-400" />
          ) : (
            <TrendingDown size={13} className="text-red-400" />
          )}
          <span
            className={
              isNeutral
                ? "text-zinc-500"
                : isPositive
                ? "text-emerald-400"
                : "text-red-400"
            }
          >
            {isPositive ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && (
            <span className="text-zinc-500">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
