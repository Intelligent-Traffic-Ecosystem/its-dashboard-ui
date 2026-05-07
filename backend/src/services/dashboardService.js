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
                totalVehicles += metric.vehicle_count || 0;
                totalSpeed += metric.avg_speed_kmh || 0;
                congestionSum += metric.congestion_score || 0;
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
                avg_speed_kmh: parseFloat(avgSpeed.toFixed(2)),
                overall_congestion_level: overallCongestionLevel,
                overall_congestion_score: parseFloat(overallCongestionScore.toFixed(2)),
                active_alerts: activeAlertsCount,
                last_updated: new Date().toISOString(),
            };
        } catch (err) {
            console.error("DashboardService.getSummary error:", err);
            return {
                total_incidents_24h: 0,
                avg_speed_kmh: 0,
                overall_congestion_level: "LOW",
                overall_congestion_score: 0,
                active_alerts: 0,
                last_updated: new Date().toISOString(),
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
                camera_id: metric.camera_id,
                timestamp: new Date(Date.now() - idx * 60000).toISOString(), // Stagger timestamps
                vehicle_class: this._randomVehicleClass(),
                speed_kmh: metric.avg_speed_kmh || 0,
                lane_id: Math.floor(Math.random() * 4) || null,
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
        // Uses hardcoded thresholds for now (could be from AdminService)
        if (score < 0.3) return "LOW";
        if (score < 0.55) return "MODERATE";
        if (score < 0.8) return "HIGH";
        return "SEVERE";
    }

    /**
     * Helper: random vehicle class for mock events
     */
    _randomVehicleClass() {
        const classes = ["car", "motorcycle", "truck", "bus", "van"];
        return classes[Math.floor(Math.random() * classes.length)];
    }
}

module.exports = DashboardService;
