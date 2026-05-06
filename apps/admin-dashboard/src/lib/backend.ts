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

export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function fetchBackendJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${path} request failed with ${response.status}${body ? `: ${body}` : ""}`);
  }

  return response.json() as Promise<T>;
}