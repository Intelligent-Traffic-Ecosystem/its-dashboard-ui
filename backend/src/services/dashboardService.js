class DashboardService {
    constructor({ trafficService }) {
        this.trafficService = trafficService;
    }

    async getSummary() {
        try {
            return await this.trafficService.getDashboardSummary();
        } catch (err) {
            console.error("DashboardService.getSummary error:", err);
            return {
                total_incidents_24h: 0,
                total_vehicles: 0,
                total_cameras_active: 0,
                avg_speed_kmh: 0,
                overall_congestion_level: "LOW",
                overall_congestion_score: 0,
                active_alerts: 0,
                congestion_breakdown: {},
                worst_camera: null,
                last_updated: new Date().toISOString(),
            };
        }
    }

    async getRecentEvents(limit = 10) {
        try {
            return await this.trafficService.getDashboardEvents(limit);
        } catch (err) {
            console.error("DashboardService.getRecentEvents error:", err);
            return [];
        }
    }
}

module.exports = DashboardService;
