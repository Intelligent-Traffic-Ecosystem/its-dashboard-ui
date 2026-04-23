"use client";

import { useLiveTimer } from "@/hooks/useLiveTimer";

// TODO: Replace simulated timer with real Socket.IO connection:
// import { io } from 'socket.io-client'
// const socket = io(process.env.NEXT_PUBLIC_WS_URL)
// socket.on('connect', () => setSeconds(0))
// socket.on('data:refresh', () => setSeconds(0))

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
  const isStale = seconds >= 30;

  const dotColor = isStale ? "#D16900" : "#22C55E";
  const label = isStale ? `Stale — ${formatElapsed(seconds)}` : `LIVE — ${formatElapsed(seconds)}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="relative flex size-2">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ background: dotColor }}
        />
        <span
          className="relative inline-flex size-2 rounded-full"
          style={{ background: dotColor }}
        />
      </span>
      <span
        className="text-xs font-medium"
        style={{
          color: isStale ? "#D16900" : "#757780",
          fontFamily: "var(--font-inter)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
