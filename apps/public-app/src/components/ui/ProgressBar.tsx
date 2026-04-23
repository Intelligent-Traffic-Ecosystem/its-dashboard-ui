interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
  showLabel?: boolean;
  /** Override automatic color with a fixed hex color */
  color?: string;
}

function congestionColor(value: number): string {
  if (value >= 80) return "#EF4444"; // danger
  if (value >= 60) return "#D16900"; // tertiary/warning
  if (value >= 40) return "#F59E0B"; // amber
  return "#22C55E";                  // success
}

export function ProgressBar({
  value,
  className = "",
  showLabel = false,
  color,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const fillColor = color ?? congestionColor(clamped);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "#22263A" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: fillColor }}
        />
      </div>
      {showLabel && (
        <span
          className="w-8 text-right text-xs tabular-nums"
          style={{ color: fillColor, fontFamily: "var(--font-inter)" }}
        >
          {clamped}%
        </span>
      )}
    </div>
  );
}
