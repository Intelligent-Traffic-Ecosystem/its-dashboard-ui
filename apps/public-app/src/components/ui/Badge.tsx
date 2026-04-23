import type { Severity, IncidentStatus, IncidentType } from "@/lib/types";

type BadgeVariant = Severity | IncidentStatus | IncidentType | string;

const VARIANT_STYLES: Record<string, string> = {
  // Severity
  critical: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40",
  high: "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40",
  medium: "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40",
  low: "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40",
  // Status
  active: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40",
  monitoring: "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40",
  resolved: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40",
  // Incident types
  accident: "bg-red-500/20 text-red-400 ring-1 ring-red-500/40",
  congestion: "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40",
  roadwork: "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40",
  hazard: "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40",
  event: "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40",
};

const DEFAULT_STYLE = "bg-zinc-700/40 text-zinc-400 ring-1 ring-zinc-600/40";

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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}
    >
      {text}
    </span>
  );
}
