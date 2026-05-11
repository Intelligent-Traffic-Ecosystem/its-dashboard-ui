import type { RoadSegment } from "./types";
import { CAMERA_LOCATIONS, ROAD_SEGMENTS } from "./dummy-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export interface TrafficMetric {
  cameraId: string;
  vehicleCount: number;
  averageSpeedKmh: number;
  congestionScore: number;
  congestionLevel: string;
  windowEnd?: string;
  stale?: boolean;
}

export interface DashboardStats {
  activeCameras: number;
  avgCongestion: number;
  avgSpeed: number;
  severeSegments: number;
}

export interface CameraChartSample {
  label: string;
  vehicleCount: number;
  avgSpeed: number;
  congestionScore: number;
}

/** Short display labels for each camera — mirrors BFF mapFeatureMapper.js */
const CAMERA_LABELS: Record<string, string> = {
  cam_01: "Galle Rd",
  cam_02: "Kandy Rd",
  cam_03: "Fort",
  cam_04: "Nugegoda",
  cam_05: "Rajagiriya",
  cam_06: "Maharagama",
  cam_07: "Borella",
  cam_08: "Wellawatte",
};

function cameraLabel(cameraId: string): string {
  return CAMERA_LABELS[cameraId] ?? cameraId;
}

function congestionPct(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function congestionLevel(pct: number): RoadSegment["level"] {
  if (pct >= 80) return "standstill";
  if (pct >= 60) return "heavy";
  if (pct >= 35) return "moderate";
  return "free";
}

/** Fetch current traffic metrics from the public BFF endpoint. */
export async function getPublicTrafficMetrics(): Promise<TrafficMetric[]> {
  if (!BACKEND_URL) return [];

  try {
    const res = await fetch(`${BACKEND_URL}/api/public/traffic/current`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: TrafficMetric[] };
    return Array.isArray(body.items) ? body.items : [];
  } catch {
    return [];
  }
}

/** Derive KPI stats from live camera metrics. Falls back to dummy totals when empty. */
export function deriveStats(metrics: TrafficMetric[]): DashboardStats {
  if (!metrics.length) {
    const avg =
      CAMERA_LOCATIONS.reduce((s, c) => s + c.congestionScore, 0) /
      CAMERA_LOCATIONS.length;
    const speed =
      ROAD_SEGMENTS.reduce((s, r) => s + r.avgSpeedKmh, 0) /
      ROAD_SEGMENTS.length;
    return {
      activeCameras: CAMERA_LOCATIONS.length,
      avgCongestion: Math.round(avg),
      avgSpeed: Math.round(speed),
      severeSegments: 2,
    };
  }

  const total = metrics.length;
  const avgCongestion =
    metrics.reduce((s, m) => s + (m.congestionScore ?? 0), 0) / total;
  const avgSpeed =
    metrics.reduce((s, m) => s + (m.averageSpeedKmh ?? 0), 0) / total;
  const severeSegments = metrics.filter(
    (m) => (m.congestionLevel ?? "").toUpperCase() === "SEVERE"
  ).length;

  return {
    activeCameras: total,
    avgCongestion: Math.round(avgCongestion),
    avgSpeed: Math.round(avgSpeed),
    severeSegments,
  };
}

/** Derive road segment rows from live camera metrics. Falls back to dummy segments when empty. */
export function deriveSegments(metrics: TrafficMetric[]): RoadSegment[] {
  if (!metrics.length) return ROAD_SEGMENTS;

  return metrics.map((m, i) => {
    const pct = congestionPct(m.congestionScore ?? 0);
    return {
      id: `CAM-${m.cameraId}`,
      name: CAMERA_LABELS[m.cameraId] ?? m.cameraId,
      congestionPct: pct,
      level: congestionLevel(pct),
      avgSpeedKmh: Math.round(m.averageSpeedKmh ?? 0),
      lastUpdated: m.windowEnd ?? new Date().toISOString(),
    } satisfies RoadSegment;
  });
}

/** Derive per-camera chart samples from live metrics. Falls back to dummy camera data when empty. */
export function deriveChartSamples(metrics: TrafficMetric[]): CameraChartSample[] {
  if (!metrics.length) {
    return CAMERA_LOCATIONS.map((cam) => ({
      label: cam.shortLabel,
      vehicleCount: cam.vehicleCount,
      avgSpeed: Math.round(
        ROAD_SEGMENTS.find((r) => r.id === `RS-00${CAMERA_LOCATIONS.indexOf(cam) + 1}`)
          ?.avgSpeedKmh ?? 40
      ),
      congestionScore: cam.congestionScore,
    }));
  }

  return metrics.map((m) => ({
    label: cameraLabel(m.cameraId),
    vehicleCount: m.vehicleCount ?? 0,
    avgSpeed: Math.round(m.averageSpeedKmh ?? 0),
    congestionScore: Math.round(m.congestionScore ?? 0),
  }));
}
