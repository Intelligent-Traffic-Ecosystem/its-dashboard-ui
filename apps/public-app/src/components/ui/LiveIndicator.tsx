"use client";

import { useLiveTimer } from "@/hooks/useLiveTimer";

interface LiveIndicatorProps {
  baseline?: Date | string;
  className?: string;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function LiveIndicator({
  baseline = new Date(),
  className = "",
}: LiveIndicatorProps) {
  const seconds = useLiveTimer(baseline);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-medium text-zinc-400">
        Live&nbsp;·&nbsp;{formatElapsed(seconds)}
      </span>
    </div>
  );
}
