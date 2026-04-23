"use client";

import { useEffect, useState } from "react";

/**
 * Returns the number of seconds elapsed since `baseline` (a Date or ISO string).
 * Recalculates every `intervalMs` milliseconds (default 1 000 ms).
 */
export function useLiveTimer(
  baseline: Date | string = new Date(),
  intervalMs = 1000
): number {
  const [seconds, setSeconds] = useState<number>(() => {
    const base = typeof baseline === "string" ? new Date(baseline) : baseline;
    return Math.floor((Date.now() - base.getTime()) / 1000);
  });

  useEffect(() => {
    const base = typeof baseline === "string" ? new Date(baseline) : baseline;

    const tick = () => {
      setSeconds(Math.floor((Date.now() - base.getTime()) / 1000));
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [baseline, intervalMs]);

  return seconds;
}
