"use client";

import { useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RoadSegmentsTable } from "@/components/dashboard/RoadSegmentsTable";
import { TrafficVolumeChart } from "@/components/dashboard/TrafficVolumeChart";
import { DashboardStaleBanner } from "@/components/dashboard/DashboardStaleBanner";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  getPublicTrafficMetrics,
  mapB2SnakeToMetric,
  resolveBackendUrl,
  deriveStats,
  deriveSegments,
  deriveChartSamples,
  type TrafficMetric,
} from "@/lib/backend-api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<TrafficMetric[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const wsRef = useRef<WebSocket | null>(null);

  // Initial HTTP fetch for an immediate first render
  useEffect(() => {
    getPublicTrafficMetrics().then((m) => {
      if (m.length > 0) {
        setMetrics(m);
        setLastUpdated(new Date());
      }
    });
  }, []);

  // WebSocket live updates — reconnects automatically on drop
  useEffect(() => {
    const backendUrl = resolveBackendUrl();
    if (!backendUrl) return;

    const wsUrl = backendUrl.replace(/^http/, "ws") + "/ws/metrics";
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const raw = JSON.parse(event.data) as Record<string, unknown>[];
          if (Array.isArray(raw) && raw.length > 0) {
            setMetrics(raw.map(mapB2SnakeToMetric));
            setLastUpdated(new Date());
          }
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const stats = deriveStats(metrics);
  const segments = deriveSegments(metrics);
  const chartSamples = deriveChartSamples(metrics);

  return (
    <PageShell
      title="Traffic Overview"
      subtitle="Real-time conditions — Colombo Metropolitan Area"
      actions={<LiveIndicator baseline={lastUpdated} />}
    >
      <div className="space-y-5">
        {/* Stale data warning — resets timer on every WebSocket update */}
        <DashboardStaleBanner lastUpdated={lastUpdated} />

        {/* KPI row */}
        <StatsRow stats={stats} />

        {/* Full-width live camera chart */}
        <TrafficVolumeChart samples={chartSamples} />

        {/* Camera segment status table */}
        <RoadSegmentsTable segments={segments} />
      </div>
    </PageShell>
  );
}
