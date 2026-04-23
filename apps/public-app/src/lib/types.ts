export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "active" | "monitoring" | "resolved";
export type IncidentType =
  | "accident"
  | "congestion"
  | "roadwork"
  | "hazard"
  | "event";
export type CongestionLevel = "free" | "moderate" | "heavy" | "standstill";

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  location: string;
  description: string;
  reportedAt: string;
  resolvedAt?: string;
  affectedLanes: number;
  lat: number;
  lng: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  congestionPct: number;
  level: CongestionLevel;
  avgSpeedKmh: number;
  incidents: number;
  lastUpdated: string;
}

export interface TrafficSample {
  hour: string;
  volume: number;
  avgSpeed: number;
}

export interface StatCardData {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: string;
  accentColor?: string;
}
