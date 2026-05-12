/**
 * B3 Backend API Client
 * Connects to B3 backend endpoints for traffic, alerts, and analytics
 */

export interface TrafficAlert {
    id: string;
    cameraId: string;
    severity: "informational" | "warning" | "critical" | "emergency";
    title: string;
    description: string;
    status: "active" | "acknowledged";
    timestamp: string;
    details?: {
        vehicleCount: number;
        averageSpeedKmh: number;
        congestionScore: number;
        queueLength: number;
    };
}

export interface AlertHistoryItem {
    alertId: string;
    cameraId?: string;
    severity?: "informational" | "warning" | "critical" | "emergency";
    title?: string;
    roadSegment?: string | null;
    congestionScore?: number | null;
    triggeredAt?: string;
    acknowledgedBy: string;
    acknowledgedAt: string;
    status: "acknowledged";
}

export interface AlertHistory {
    items: AlertHistoryItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface AlertHistoryFilters {
    cameraId?: string;
    severity?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
}

export interface TrafficMetric {
    cameraId: string;
    windowStart: string | null;
    windowEnd: string | null;
    laneId: number | null;
    vehicleCount: number;
    countsByClass: Record<string, number>;
    averageSpeedKmh: number;
    stoppedRatio: number;
    queueLength: number;
    congestionLevel: "LOW" | "MODERATE" | "HIGH" | "SEVERE";
    congestionScore: number;
    stale: boolean;
}

export interface TrafficCamera {
    id: string;
    cameraId?: string;
    camera_id?: string;
    name?: string;
    label?: string;
}

export interface DashboardSummary {
    total_incidents_24h: number;
    total_vehicles?: number;
    avg_speed_kmh: number;
    overall_congestion_level: string;
    overall_congestion_score: number;
    active_alerts?: number;
    active_alerts_count?: number;
    last_updated?: string;
    lastUpdated?: string;
}

export interface DashboardEvent {
    id?: string;
    cameraId?: string;
    camera_id?: string;
    timestamp: string;
    eventType?: string;
    vehicleClass?: string;
    vehicle_class?: string;
    speedKmh?: number;
    speed_kmh?: number;
    laneId?: number | null;
    lane_id?: number | null;
    severity?: string;
    congestionLevel?: string;
    congestionScore?: number;
    vehicleCount?: number;
}

export interface HeatmapPoint {
    cameraId?: string;
    camera_id?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    weight: number;
    vehicleCount?: number;
    vehicle_count?: number;
    congestionScore?: number;
}

export interface LocationPoint {
    cameraId?: string;
    camera_id?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
}

export interface MapIncident {
    alertId?: string;
    alert_id?: string;
    cameraId?: string;
    camera_id?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    severity: TrafficAlert["severity"] | string;
    alertType?: string;
    alert_type?: string;
    title: string;
    message?: string;
    timestamp?: string;
    triggered_at?: string;
}

export interface HealthStatus {
    status: string;
    service?: string;
    uptime?: number;
    upstream?: {
        b2?: {
            status?: string;
            kafka?: string;
            postgres?: string;
        };
    };
    b2Status?: string;
}

export interface AnalyticsTrend {
    cameraId: string;
    from: string;
    to: string;
    trend: "increasing" | "decreasing" | "stable" | "no_data";
    percentageChange: number;
    speedTrend: "increasing" | "decreasing" | "stable" | "no_data";
    speedChange: number;
    peakHour: {
        timestamp: string;
        congestionScore: number;
        vehicleCount: number;
        averageSpeedKmh: number;
    } | null;
    lowestCongestionWindow: {
        timestamp: string;
        congestionScore: number;
        vehicleCount: number;
        averageSpeedKmh: number;
    } | null;
    series: Array<{
        timestamp: string;
        congestionScore: number;
        averageSpeedKmh: number;
        vehicleCount: number;
    }>;
}

export interface AnalyticsSummary {
    cameraId: string;
    from: string;
    to: string;
    totalWindows: number;
    totalVehicles: number;
    averageCongestionScore: number;
    averageSpeedKmh: number;
    peakWindow: TrafficMetric | null;
    series: TrafficMetric[];
}

export interface AnalyticsMetrics {
    range_start: string;
    range_end: string;
    avg_congestion_score: number;
    peak_hour_distribution: Array<{
        hour: number;
        avg_vehicle_count: number;
        avg_congestion_score: number;
    }>;
    top_segments: Array<{
        camera_id: string;
        road_segment: string | null;
        avg_congestion_score: number;
        severe_minutes: number;
    }>;
    incident_pie: Array<{
        severity: string;
        count: number;
    }>;
}

export interface AnalyticsComparison {
    range_a: AnalyticsMetrics;
    range_b: AnalyticsMetrics;
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

async function get<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE}${path}`;
    const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`B3 API ${path} failed: ${res.status} ${error}`);
    }

    return res.json() as Promise<T>;
}

export const b3Backend = {
    dashboard: {
        getSummary: () => get<DashboardSummary>("/api/dashboard/summary"),
        getEvents: (limit: number = 10) =>
            get<DashboardEvent[]>(
                `/api/dashboard/events?${new URLSearchParams({
                    limit: limit.toString(),
                }).toString()}`
            ),
    },

    // Alerts API
    alerts: {
        /**
         * Get active traffic alerts
         */
        listActive: () => get<TrafficAlert[]>("/api/alerts/active"),

        /**
         * Get alert history with pagination
         * @param cameraId - Optional: filter by camera ID
         * @param limit - Number of results (default: 100, max: 1000)
         * @param offset - Pagination offset (default: 0)
         */
        getHistory: (cameraIdOrFilters?: string | AlertHistoryFilters, limit: number = 100, offset: number = 0) => {
            const filters = typeof cameraIdOrFilters === "object"
                ? cameraIdOrFilters
                : { cameraId: cameraIdOrFilters, limit, offset };
            return (
                get<AlertHistory>(
                    `/api/alerts/history?${new URLSearchParams({
                        ...(filters.cameraId && { cameraId: filters.cameraId }),
                        ...(filters.severity && { severity: filters.severity }),
                        ...(filters.from && { from: filters.from }),
                        ...(filters.to && { to: filters.to }),
                        limit: String(filters.limit ?? limit),
                        offset: String(filters.offset ?? offset),
                    }).toString()}`
                )
            );
        },

        getExportCsvUrl: (filters: AlertHistoryFilters = {}) =>
            `${BASE}/api/alerts/export?${new URLSearchParams({
                ...(filters.cameraId && { camera_id: filters.cameraId }),
                ...(filters.severity && { severity: filters.severity }),
                ...(filters.from && { from: filters.from }),
                ...(filters.to && { to: filters.to }),
                limit: String(filters.limit ?? 500000),
            }).toString()}`,

        /**
         * Acknowledge an alert
         * @param alertId - Alert ID to acknowledge
         */
        acknowledge: (alertId: string) =>
            get<{ alertId: string; acknowledgedAt: string; acknowledgedBy: string }>(
                `/api/alerts/${alertId}/acknowledge`,
                { method: "POST" }
            ),
    },

    // Analytics API
    analytics: {
        /**
         * Get traffic analytics summary
         * @param cameraId - Camera ID
         * @param from - Start timestamp (ISO 8601)
         * @param to - End timestamp (ISO 8601)
         */
        getSummary: (cameraId: string, from: string, to: string) =>
            get<AnalyticsSummary>(
                `/api/analytics/summary?${new URLSearchParams({
                    cameraId,
                    from,
                    to,
                }).toString()}`
            ),

        /**
         * Get traffic trends with peak hour detection
         * @param cameraId - Camera ID
         * @param from - Start timestamp (ISO 8601)
         * @param to - End timestamp (ISO 8601)
         */
        getTrends: (cameraId: string, from: string, to: string) =>
            get<AnalyticsTrend>(
                `/api/analytics/trends/${encodeURIComponent(cameraId)}?${new URLSearchParams({
                    from,
                    to,
                }).toString()}`
            ),

        getMetrics: (from: string, to: string) =>
            get<AnalyticsMetrics>(
                `/api/analytics/metrics?${new URLSearchParams({
                    from,
                    to,
                }).toString()}`
            ),

        compare: (aFrom: string, aTo: string, bFrom: string, bTo: string) =>
            get<AnalyticsComparison>(
                `/api/analytics/compare?${new URLSearchParams({
                    aFrom,
                    aTo,
                    bFrom,
                    bTo,
                }).toString()}`
            ),

        getReportPdfUrl: (from: string, to: string) =>
            `${BASE}/api/analytics/report/pdf?${new URLSearchParams({ from, to }).toString()}`,
    },

    // Traffic API
    traffic: {
        /**
         * List all traffic cameras
         */
        listCameras: () => get<TrafficCamera[]>("/api/traffic/cameras"),

        /**
         * Get current metric for a camera
         * @param cameraId - Camera ID
         */
        getCurrentMetric: (cameraId: string) =>
            get(`/api/traffic/metrics/current?cameraId=${encodeURIComponent(cameraId)}`),

        /**
         * Get metric history for a camera
         * @param cameraId - Camera ID
         * @param from - Start timestamp (ISO 8601)
         * @param to - End timestamp (ISO 8601)
         */
        getMetricHistory: (cameraId: string, from: string, to: string) =>
            get(
                `/api/traffic/metrics/history?${new URLSearchParams({
                    cameraId,
                    from,
                    to,
                }).toString()}`
            ),

        /**
         * Get current congestion across all cameras
         */
        getCurrentCongestion: () => get("/api/traffic/congestion/current"),
        getCurrentCongestionTyped: () => get<TrafficMetric[]>("/api/traffic/congestion/current"),
    },

    map: {
        getHeatmap: () => get<HeatmapPoint[]>("/api/map/heatmap"),
        getIncidents: () => get<MapIncident[]>("/api/map/incidents"),
    },

    // Locations API
    locations: {
        /**
         * Get all map pin locations
         */
        listAll: () => get<LocationPoint[]>("/api/locations"),
    },

    // Health API
    health: {
        /**
         * Get backend health status
         */
        check: () => get<HealthStatus>("/health"),
    },
};

/**
 * Helper to format ISO timestamp to readable date
 */
export function formatAlertTime(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return timestamp;
    }
}

/**
 * Helper to format congestion score to label
 */
export function getCongestionLabel(score: number): string {
    if (score >= 75) return "Critical";
    if (score >= 50) return "High";
    if (score >= 25) return "Moderate";
    return "Low";
}

/**
 * Helper to get icon class for severity
 */
export function getSeverityIcon(severity: string): { icon: string; class: string } {
    switch (severity) {
        case "emergency":
            return { icon: "emergency", class: "text-error" };
        case "critical":
            return { icon: "warning", class: "text-error-container" };
        case "warning":
            return { icon: "info", class: "text-warning" };
        case "informational":
        default:
            return { icon: "check_circle", class: "text-success" };
    }
}
