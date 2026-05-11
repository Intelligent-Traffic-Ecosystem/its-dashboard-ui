import { INCIDENTS } from "./dummy-data";
import type { Incident, IncidentStatus, IncidentType, Severity } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const USE_DUMMY_MAP_DATA = process.env.NEXT_PUBLIC_USE_DUMMY_MAP_DATA === "true";
const COLOMBO_CENTER = { lat: 6.9271, lng: 79.8612 };
const DUMMY_SOURCE_CENTER = { lat: 51.51, lng: -0.1 };

export interface HeatmapPoint {
  cameraId?: string;
  camera_id?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  weight?: number;
  vehicleCount?: number;
  vehicle_count?: number;
  congestionScore?: number;
}

export interface MapIncident {
  alertId?: string | number;
  alert_id?: string | number;
  cameraId?: string;
  camera_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  severity?: string;
  alertType?: string;
  alert_type?: string;
  title?: string;
  message?: string;
  timestamp?: string;
  triggered_at?: string;
}

export interface PublicMapData {
  heatmap: HeatmapPoint[];
  incidents: Incident[];
  trafficLocations: Incident[];
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "omit",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

function toSeverity(value?: string, score?: number): Severity {
  const normalized = value?.toLowerCase();
  if (normalized === "emergency" || normalized === "critical") return "critical";
  if (normalized === "warning" || normalized === "high") return "high";
  if (normalized === "medium" || normalized === "moderate") return "medium";
  if (typeof score === "number") {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
  }
  return "low";
}

function toIncidentType(value?: string): IncidentType {
  const normalized = value?.toLowerCase();
  if (normalized === "accident" || normalized === "roadwork" || normalized === "hazard" || normalized === "event") {
    return normalized;
  }
  return "congestion";
}

function validCoordinate(lat?: number | null, lng?: number | null) {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);
}

function mapIncident(item: MapIncident, index: number): Incident | null {
  const lat = item.lat ?? item.latitude;
  const lng = item.lng ?? item.longitude;
  if (!validCoordinate(lat, lng)) return null;

  const cameraId = item.cameraId ?? item.camera_id ?? "unknown camera";
  const timestamp = item.timestamp ?? item.triggered_at ?? new Date().toISOString();

  return {
    id: String(item.alertId ?? item.alert_id ?? `INC-${cameraId}-${index}`),
    type: toIncidentType(item.alertType ?? item.alert_type),
    severity: toSeverity(item.severity),
    status: "active" satisfies IncidentStatus,
    location: `${cameraId} traffic camera`,
    description: item.message || item.title || "Active traffic alert reported at this location.",
    reportedAt: timestamp,
    affectedLanes: 0,
    lat: lat as number,
    lng: lng as number,
  };
}

function mapHeatmapPoint(item: HeatmapPoint, index: number): Incident | null {
  const lat = item.lat ?? item.latitude;
  const lng = item.lng ?? item.longitude;
  if (!validCoordinate(lat, lng)) return null;

  const cameraId = item.cameraId ?? item.camera_id ?? `camera-${index + 1}`;
  const vehicleCount = item.vehicleCount ?? item.vehicle_count ?? 0;
  const score = item.congestionScore ?? Math.round((item.weight ?? 0) * 100);
  const severity = toSeverity(undefined, score);

  return {
    id: `TRAFFIC-${cameraId}`,
    type: "congestion",
    severity,
    status: score >= 60 ? "active" : "monitoring",
    location: `${cameraId} traffic camera`,
    description: `${vehicleCount} vehicles detected. Congestion score ${score}.`,
    reportedAt: new Date().toISOString(),
    affectedLanes: 0,
    lat: lat as number,
    lng: lng as number,
  };
}

function dummyIncidentToColombo(incident: Incident): Incident {
  return {
    ...incident,
    lat: COLOMBO_CENTER.lat + (incident.lat - DUMMY_SOURCE_CENTER.lat),
    lng: COLOMBO_CENTER.lng + (incident.lng - DUMMY_SOURCE_CENTER.lng),
  };
}

function severityScore(severity: Severity) {
  switch (severity) {
    case "critical":
      return 90;
    case "high":
      return 72;
    case "medium":
      return 52;
    case "low":
    default:
      return 24;
  }
}

function getDummyMapData(): PublicMapData {
  const incidents = INCIDENTS.map(dummyIncidentToColombo);
  const heatmap = incidents.map<HeatmapPoint>((incident, index) => {
    const score = severityScore(incident.severity);
    return {
      cameraId: `demo-cam-${String(index + 1).padStart(2, "0")}`,
      camera_id: `demo-cam-${String(index + 1).padStart(2, "0")}`,
      lat: incident.lat,
      lng: incident.lng,
      latitude: incident.lat,
      longitude: incident.lng,
      weight: Math.max(0.1, Math.min(1, score / 100)),
      vehicleCount: 8 + index * 4,
      vehicle_count: 8 + index * 4,
      congestionScore: score,
    };
  });

  return {
    heatmap,
    incidents,
    trafficLocations: heatmap.map(mapHeatmapPoint).filter((item): item is Incident => item !== null),
  };
}

export async function getPublicMapData(): Promise<PublicMapData> {
  if (USE_DUMMY_MAP_DATA) return getDummyMapData();

  const [heatmap, incidentRows] = await Promise.all([
    getJson<HeatmapPoint[]>("/api/map/heatmap"),
    getJson<MapIncident[]>("/api/map/incidents"),
  ]);

  return {
    heatmap,
    incidents: incidentRows.map(mapIncident).filter((item): item is Incident => item !== null),
    trafficLocations: heatmap.map(mapHeatmapPoint).filter((item): item is Incident => item !== null),
  };
}
