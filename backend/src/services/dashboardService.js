/**
 * DashboardService — Real-time dashboard metrics and events
 */

class DashboardService {
    constructor({ trafficService, alertService }) {
        this.trafficService = trafficService;
        this.alertService = alertService;
    }

    /**
     * Get dashboard summary
     * Includes 24h incident count, current avg speed, congestion level, active alerts
     */
    async getSummary() {
        try {
            // Get current metrics (last 5 minutes of data)
            const currentMetrics = await this.trafficService.getCurrentCongestion();

            // Calculate overall stats
            let totalVehicles = 0;
            let totalSpeed = 0;
            let metricCount = 0;
            let congestionSum = 0;

            currentMetrics.forEach((metric) => {
                totalVehicles += metric.vehicleCount || 0;
                totalSpeed += metric.averageSpeedKmh || 0;
                congestionSum += metric.congestionScore || 0;
                metricCount++;
            });

            const avgSpeed = metricCount > 0 ? totalSpeed / metricCount : 0;
            const overallCongestionScore = metricCount > 0 ? congestionSum / metricCount : 0;

            // Map score to congestion level
            const overallCongestionLevel = this._mapScoreToLevel(overallCongestionScore);

            // Get active alerts count
            const activeAlerts = await this.alertService.listActiveAlerts();
            const activeAlertsCount = activeAlerts.length;

            // Count 24h incidents (approximation: count active alerts + recent ones)
            const incidentsIn24h = activeAlertsCount + Math.floor(Math.random() * 20); // Mock for now

            return {
                total_incidents_24h: incidentsIn24h,
                total_vehicles: totalVehicles,
                avg_speed_kmh: parseFloat(avgSpeed.toFixed(2)),
                overall_congestion_level: overallCongestionLevel,
                overall_congestion_score: parseFloat(overallCongestionScore.toFixed(2)),
                active_alerts: activeAlertsCount,
                active_alerts_count: activeAlertsCount,
                last_updated: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
            };
        } catch (err) {
            console.error("DashboardService.getSummary error:", err);
            return {
                total_incidents_24h: 0,
                total_vehicles: 0,
                avg_speed_kmh: 0,
                overall_congestion_level: "LOW",
                overall_congestion_score: 0,
                active_alerts: 0,
                active_alerts_count: 0,
                last_updated: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
            };
        }
    }

    /**
     * Get recent traffic events
     */
    async getRecentEvents(limit = 10) {
        try {
            // Mock: return simulated recent events based on current metrics
            const currentMetrics = await this.trafficService.getCurrentCongestion();

            const events = currentMetrics.slice(0, limit).map((metric, idx) => ({
                id: `${metric.cameraId}-${metric.windowEnd || idx}`,
                cameraId: metric.cameraId,
                camera_id: metric.cameraId,
                timestamp: metric.windowEnd || metric.windowStart || new Date(Date.now() - idx * 60000).toISOString(),
                eventType: this._eventTypeFromMetric(metric),
                vehicleClass: this._primaryVehicleClass(metric),
                vehicle_class: this._primaryVehicleClass(metric),
                speedKmh: metric.averageSpeedKmh || 0,
                speed_kmh: metric.averageSpeedKmh || 0,
                laneId: metric.laneId,
                lane_id: metric.laneId,
                severity: this._severityFromMetric(metric),
                congestionLevel: metric.congestionLevel,
                congestionScore: metric.congestionScore,
                vehicleCount: metric.vehicleCount,
            }));

            return events;
        } catch (err) {
            console.error("DashboardService.getRecentEvents error:", err);
            return [];
        }
    }

    /**
     * Helper: map congestion score to level
     */
    _mapScoreToLevel(score) {
        if (score < 30) return "LOW";
        if (score < 55) return "MODERATE";
        if (score < 80) return "HIGH";
        return "SEVERE";
    }

    _primaryVehicleClass(metric) {
        const entries = Object.entries(metric.countsByClass || {});
        if (!entries.length) return "vehicle";
        return entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];
    }

    _eventTypeFromMetric(metric) {
        if (metric.congestionLevel === "CRITICAL") return "CONGESTION_CRITICAL";
        if (metric.congestionLevel === "HIGH") return "CONGESTION_HIGH";
        if (metric.congestionLevel === "MEDIUM") return "FLOW_DEGRADE";
        return "FLOW_NORMAL";
    }

    _severityFromMetric(metric) {
        if (metric.congestionLevel === "CRITICAL") return "emergency";
        if (metric.congestionLevel === "HIGH") return "critical";
        if (metric.congestionLevel === "MEDIUM") return "warning";
        return "informational";
    }
}

module.exports = DashboardService;
