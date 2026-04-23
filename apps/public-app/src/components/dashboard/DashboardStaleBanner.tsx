"use client";

import { useLiveTimer } from "@/hooks/useLiveTimer";
import { StaleBanner } from "@/components/ui/StaleBanner";

export function DashboardStaleBanner() {
  const seconds = useLiveTimer(new Date());
  return <StaleBanner ageSeconds={seconds} />;
}
