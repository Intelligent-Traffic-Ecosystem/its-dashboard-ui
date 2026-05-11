import { CAMERA_LOCATIONS } from "./dummy-data";
import type { Incident, IncidentStatus, Severity } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const USE_DUMMY_MAP_DATA = process.env.NEXT_PUBLIC_USE_DUMMY_MAP_DATA === "true";

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

export interface PublicMapData {
  heatmap: HeatmapPoint[];
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

function toSeverity(score?: number): Severity {
  if (typeof score === "number") {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
  }
  return "low";
}

function heatmapWeight(point: HeatmapPoint): number {
  if (typeof point.weight === "number") return Math.max(0.1, Math.min(1, point.weight));
  const score = point.congestionScore ?? 0;
  return Math.max(0.1, Math.min(1, score / 100));
}

function validCoordinate(lat?: number | null, lng?: number | null) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  );
}

function mapHeatmapPoint(item: HeatmapPoint, index: number): Incident | null {
  const lat = item.lat ?? item.latitude;
  const lng = item.lng ?? item.longitude;
  if (!validCoordinate(lat, lng)) return null;

  const cameraId = item.cameraId ?? item.camera_id ?? `camera-${index + 1}`;
  const vehicleCount = item.vehicleCount ?? item.vehicle_count ?? 0;
  const score = item.congestionScore ?? Math.round(heatmapWeight(item) * 100);
  const severity = toSeverity(score);

  return {
    id: `TRAFFIC-${cameraId}`,
    type: "congestion",
    severity,
    status: (score >= 60 ? "active" : "monitoring") satisfies IncidentStatus,
    location: `${cameraId} traffic camera`,
    description: `${vehicleCount} vehicles detected. Congestion score ${score}.`,
    reportedAt: new Date().toISOString(),
    affectedLanes: 0,
    lat: lat as number,
    lng: lng as number,
  };
}

function getDummyMapData(): PublicMapData {
  const heatmap: HeatmapPoint[] = CAMERA_LOCATIONS.map((cam) => ({
    cameraId: cam.cameraId,
    camera_id: cam.cameraId,
    lat: cam.lat,
    lng: cam.lng,
    latitude: cam.lat,
    longitude: cam.lng,
    weight: cam.weight,
    vehicleCount: cam.vehicleCount,
    vehicle_count: cam.vehicleCount,
    congestionScore: cam.congestionScore,
  }));

  return {
    heatmap,
    trafficLocations: heatmap
      .map(mapHeatmapPoint)
      .filter((item): item is Incident => item !== null),
  };
}

export async function getPublicMapData(): Promise<PublicMapData> {
  if (USE_DUMMY_MAP_DATA) return getDummyMapData();

  try {
    const { items } = await getJson<{ items: HeatmapPoint[] }>(
      "/api/public/map/heatmap"
    );

    if (!items || items.length === 0) return getDummyMapData();

    return {
      heatmap: items,
      trafficLocations: items
        .map(mapHeatmapPoint)
        .filter((item): item is Incident => item !== null),
    };
  } catch {
    return getDummyMapData();
  }
}
