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
  accentColor = "#4CD7F6",
}: StatCardProps) {
  const hasTrend = trend !== undefined;
  const isPositive = (trend ?? 0) > 0;
  const isNeutral = trend === 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "#1A1D27",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "#757780", fontFamily: "var(--font-inter)" }}
        >
          {label}
        </p>
        {icon && (
          <span style={{ color: accentColor }} className="opacity-80">
            {icon}
          </span>
        )}
      </div>

      <p
        className="text-3xl font-bold tabular-nums leading-none"
        style={{ color: accentColor, fontFamily: "var(--font-space-grotesk)" }}
      >
        {value}
      </p>

      {hasTrend && (
        <div className="flex items-center gap-1.5 text-xs" style={{ fontFamily: "var(--font-inter)" }}>
          {isNeutral ? (
            <Minus size={12} style={{ color: "#757780" }} />
          ) : isPositive ? (
            <TrendingUp size={12} style={{ color: "#22C55E" }} />
          ) : (
            <TrendingDown size={12} style={{ color: "#EF4444" }} />
          )}
          <span
            style={{
              color: isNeutral ? "#757780" : isPositive ? "#22C55E" : "#EF4444",
            }}
          >
            {isPositive ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && (
            <span style={{ color: "#757780" }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
