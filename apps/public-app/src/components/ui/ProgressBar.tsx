interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
  showLabel?: boolean;
}

function congestionColor(value: number): string {
  if (value >= 80) return "bg-red-500";
  if (value >= 60) return "bg-orange-500";
  if (value >= 40) return "bg-yellow-500";
  return "bg-emerald-500";
}

export function ProgressBar({
  value,
  className = "",
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const color = congestionColor(clamped);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-8 text-right text-xs tabular-nums text-zinc-400">
          {clamped}%
        </span>
      )}
    </div>
  );
}
