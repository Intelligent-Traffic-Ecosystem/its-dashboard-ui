import { AlertTriangle } from "lucide-react";

interface StaleBannerProps {
  /** Age of data in seconds */
  ageSeconds: number;
  /** Seconds after which the banner is shown (default 30) */
  threshold?: number;
  className?: string;
}

export function StaleBanner({
  ageSeconds,
  threshold = 30,
  className = "",
}: StaleBannerProps) {
  if (ageSeconds < threshold) return null;

  return (
    <div
      className={`fade-in flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm transition-opacity ${className}`}
      style={{
        background: "rgba(209,105,0,0.12)",
        border: "1px solid #D16900",
        color: "#D16900",
        fontFamily: "var(--font-inter)",
      }}
    >
      <AlertTriangle size={14} className="shrink-0" />
      <span>
        Data may be stale — last update{" "}
        <strong>{ageSeconds}s ago</strong>. Refresh to see the latest.
      </span>
    </div>
  );
}
