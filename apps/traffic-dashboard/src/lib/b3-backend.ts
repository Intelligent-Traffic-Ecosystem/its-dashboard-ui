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
        getHistory: (cameraId?: string, limit: number = 100, offset: number = 0) =>
            get<AlertHistory>(
                `/api/alerts/history?${new URLSearchParams({
                    ...(cameraId && { cameraId }),
                    limit: limit.toString(),
                    offset: offset.toString(),
                }).toString()}`
            ),

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
            get(
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
    },

    // Traffic API
    traffic: {
        /**
         * List all traffic cameras
         */
        listCameras: () => get("/api/traffic/cameras"),

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
    },

    // Locations API
    locations: {
        /**
         * Get all map pin locations
         */
        listAll: () => get("/api/locations"),
    },

    // Health API
    health: {
        /**
         * Get backend health status
         */
        check: () => get("/health"),
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
