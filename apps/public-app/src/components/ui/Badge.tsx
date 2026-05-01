import type { Severity, IncidentStatus, IncidentType, CongestionLevel } from "@/lib/types";

type BadgeVariant = Severity | IncidentStatus | IncidentType | CongestionLevel | string;

interface VariantStyle {
  background: string;
  color: string;
}

const VARIANT_STYLES: Record<string, VariantStyle> = {
  // Severity
  critical:   { background: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  high:       { background: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  warning:    { background: "rgba(209,105,0,0.15)",   color: "#D16900" },
  medium:     { background: "rgba(209,105,0,0.15)",   color: "#D16900" },
  low:        { background: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  info:       { background: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  // Congestion level
  standstill: { background: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  heavy:      { background: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  moderate:   { background: "rgba(209,105,0,0.15)",   color: "#D16900" },
  free:       { background: "rgba(34,197,94,0.15)",   color: "#22C55E" },
  free_flow:  { background: "rgba(34,197,94,0.15)",   color: "#22C55E" },
  // Incident status
  active:     { background: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  ongoing:    { background: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  monitoring: { background: "rgba(245,158,11,0.15)",  color: "#F59E0B" },
  resolved:   { background: "rgba(34,197,94,0.15)",   color: "#22C55E" },
  // Incident types
  accident:   { background: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  congestion: { background: "rgba(209,105,0,0.15)",   color: "#D16900" },
  roadwork:   { background: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  hazard:     { background: "rgba(209,105,0,0.15)",   color: "#D16900" },
  event:      { background: "rgba(139,92,246,0.15)",  color: "#8B5CF6" },
};

const DEFAULT_STYLE: VariantStyle = {
  background: "rgba(117,119,128,0.15)",
  color: "#757780",
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

export function Badge({ variant, label, className = "" }: BadgeProps) {
  const style = VARIANT_STYLES[variant] ?? DEFAULT_STYLE;
  const text = label ?? variant;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}
      style={{
        background: style.background,
        color: style.color,
        fontFamily: "var(--font-inter)",
      }}
    >
      {text}
    </span>
  );
}
