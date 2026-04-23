import { AlertTriangle } from "lucide-react";

interface StaleBannerProps {
  /** Age of data in seconds */
  ageSeconds: number;
  /** Seconds after which the banner is shown (default 120 = 2 min) */
  threshold?: number;
  className?: string;
}

export function StaleBanner({
  ageSeconds,
  threshold = 120,
  className = "",
}: StaleBannerProps) {
  if (ageSeconds < threshold) return null;

  const minutes = Math.floor(ageSeconds / 60);

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/30 px-4 py-2.5 text-sm text-amber-400 ${className}`}
    >
      <AlertTriangle size={15} className="shrink-0" />
      <span>
        Data may be stale — last updated{" "}
        <strong>{minutes} minute{minutes !== 1 ? "s" : ""}</strong> ago. Refresh
        to see the latest.
      </span>
    </div>
  );
}
