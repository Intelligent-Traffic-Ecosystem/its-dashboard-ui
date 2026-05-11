"use client";

import { useLiveTimer } from "@/hooks/useLiveTimer";
import { StaleBanner } from "@/components/ui/StaleBanner";

interface DashboardStaleBannerProps {
  /** When provided, the stale timer counts from this date instead of mount time. */
  lastUpdated?: Date;
}

export function DashboardStaleBanner({ lastUpdated }: DashboardStaleBannerProps) {
  const seconds = useLiveTimer(lastUpdated ?? new Date());
  return <StaleBanner ageSeconds={seconds} />;
}
