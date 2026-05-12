/**
 * Server-side B2 adapter — only import this from Next.js route handlers.
 * Never import in "use client" components; call /api/b2/* routes instead.
 */

export interface TrafficMetric {
  camera_id: string;
  window_start: string;
  window_end: string;
  lane_id: number | null;
  vehicle_count: number;
  counts_by_class: Record<string, number>;
  avg_speed_kmh: number;
  stopped_ratio: number;
  queue_length: number;
  congestion_level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  congestion_score: number;
}

export interface CameraInfo {
  camera_id: string;
  last_seen: string | null;
}

export interface HealthResponse {
  status: string;
  kafka: string;
  postgres: string;
}

const BASE = process.env.B2_API_URL ?? "http://localhost:18000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`B2 ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const b2 = {
  cameras: () => get<CameraInfo[]>("/cameras"),
  congestionCurrent: () => get<TrafficMetric[]>("/congestion/current"),
  metricsCurrent: (camera_id: string) =>
    get<TrafficMetric>(`/metrics/current?camera_id=${encodeURIComponent(camera_id)}`),
  metricsHistory: (camera_id: string, from: string, to: string) =>
    get<TrafficMetric[]>(
      `/metrics/history?camera_id=${encodeURIComponent(camera_id)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),
  health: () => get<HealthResponse>("/health"),
};
