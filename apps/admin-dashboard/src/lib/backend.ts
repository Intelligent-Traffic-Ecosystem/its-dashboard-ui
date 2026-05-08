export type BackendLocation = {
  id: string;
  type: "sensor" | "incident";
  severity: "info" | "warning" | "critical" | "emergency";
  lat: number;
  lng: number;
  title: string;
  description: string;
  status: "active" | "stale";
  timestamp: string;
  details: {
    vehicleCount: number;
    avgSpeedKmh: number;
    congestionScore: number;
    queueLength: number;
  };
};

export type BackendAlert = {
  id: string;
  type: string;
  severity: "informational" | "warning" | "critical" | "emergency";
  cameraId: string;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  details: Record<string, unknown>;
};

export type BackendCamera = {
  cameraId: string;
  lastSeen: string | null;
  stale: boolean;
};

export type DashboardSummary = {
  total_incidents_24h: number;
  avg_speed_kmh: number;
  overall_congestion_level: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
  overall_congestion_score: number;
  active_alerts: number;
  last_updated: string;
};

export type DashboardEvent = {
  camera_id: string;
  timestamp: string;
  vehicle_class: string;
  speed_kmh: number;
  lane_id: number | null;
};

export type Alert = {
  id: string;
  severity: "WARNING" | "CRITICAL" | "EMERGENCY";
  type: string;
  cameraId: string;
  roadSegment: string | null;
  title: string;
  message: string;
  congestionLevel: number | null;
  congestionScore: number | null;
  triggeredAt: string;
  resolvedAt: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  status: "active" | "acknowledged";
};

export type AlertHistory = {
  items: Alert[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type AnalyticsMetrics = {
  range_start: string;
  range_end: string;
  avg_congestion_score: number;
  peak_hour_distribution: { hour: number; avg_vehicle_count: number; avg_congestion_score: number }[];
  top_segments: {
    camera_id: string;
    road_segment: string | null;
    avg_congestion_score: number;
    severe_minutes: number;
  }[];
  incident_pie: { severity: string; count: number }[];
};

export type Thresholds = {
  congestion_threshold_low: number;
  congestion_threshold_moderate: number;
  congestion_threshold_high: number;
};

export type Zone = {
  id: number;
  name: string;
  description: string;
  coordinates: { lat: number; lon: number }[];
  created_at: string;
  updated_at: string;
};

const requiredBackendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!requiredBackendBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_BACKEND_URL configuration");
}

export const BACKEND_BASE_URL = requiredBackendBaseUrl;
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "admin-token-default";

export async function fetchBackendJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${path} request failed with ${response.status}${body ? `: ${body}` : ""}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchAdminJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": ADMIN_TOKEN,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${path} request failed with ${response.status}${body ? `: ${body}` : ""}`);
  }

  return response.json() as Promise<T>;
}

// Dashboard
export const getDashboardSummary = () =>
  fetchBackendJson<DashboardSummary>("/api/dashboard/summary");

export const getDashboardEvents = (limit = 10) =>
  fetchBackendJson<DashboardEvent[]>(`/api/dashboard/events?limit=${limit}`);

// Alerts
export const getActiveAlerts = () =>
  fetchBackendJson<Alert[]>("/api/alerts/active");

export type AlertFilters = {
  severity?: string;
  cameraId?: string;
  alert_type?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export function getAlertHistory(filters: AlertFilters = {}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.cameraId) params.set("cameraId", filters.cameraId);
  if (filters.alert_type) params.set("alert_type", filters.alert_type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));
  return fetchBackendJson<AlertHistory>(`/api/alerts/history?${params.toString()}`);
}

export const acknowledgeAlert = (id: string) =>
  fetchBackendJson<Alert>(`/api/alerts/${id}/acknowledge`, { method: "POST" });

export function alertsExportUrl(filters: AlertFilters = {}) {
  const params = new URLSearchParams();
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.cameraId) params.set("camera_id", filters.cameraId);
  if (filters.alert_type) params.set("alert_type", filters.alert_type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `${BACKEND_BASE_URL}/api/alerts/export?${params.toString()}`;
}

// Analytics
export function getAnalyticsMetrics(from: string, to: string) {
  return fetchBackendJson<AnalyticsMetrics>(
    `/api/analytics/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export function analyticsReportUrl(from: string, to: string) {
  return `${BACKEND_BASE_URL}/api/analytics/report/pdf?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

// Admin — thresholds
export const getThresholds = () =>
  fetchAdminJson<Thresholds>("/api/admin/thresholds");

export const updateThresholds = (data: Thresholds) =>
  fetchAdminJson<Thresholds>("/api/admin/thresholds", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// Admin — zones
export const getZones = () => fetchAdminJson<Zone[]>("/api/admin/zones");

export const createZone = (data: { name: string; description: string; coordinates: { lat: number; lon: number }[] }) =>
  fetchAdminJson<Zone>("/api/admin/zones", { method: "POST", body: JSON.stringify(data) });

export const updateZone = (
  zoneId: number,
  data: Partial<{ name: string; description: string; coordinates: { lat: number; lon: number }[] }>
) =>
  fetchAdminJson<Zone>(`/api/admin/zones/${zoneId}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteZone = (zoneId: number) =>
  fetch(`${BACKEND_BASE_URL}/api/admin/zones/${zoneId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "X-Admin-Token": ADMIN_TOKEN },
  });
