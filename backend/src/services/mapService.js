/**
 * MapService — Heatmap and incident marker data for Mapbox
 */

class MapService {
    constructor({ trafficService, alertService, adminService }) {
        this.trafficService = trafficService;
        this.alertService = alertService;
        this.adminService = adminService;
    }

    /**
     * Get heatmap data — vehicle density points for map visualization
     * Uses latest metric per camera within last 5 minutes
     */
    async getHeatmap() {
        try {
            const currentMetrics = await this.trafficService.getCurrentCongestion();
            const cameras = this.adminService.listCameras();

            // Create a map of camera_id -> camera info
            const cameraMap = new Map(cameras.map((c) => [c.camera_id, c]));

            // Calculate max vehicle count for normalization
            const maxVehicleCount = Math.max(...currentMetrics.map((m) => m.vehicle_count || 0), 1);

            // Build heatmap points with lat/lng from camera registry
            const heatmapPoints = currentMetrics
                .filter((metric) => {
                    const camera = cameraMap.get(metric.camera_id);
                    // Only include cameras with coordinates
                    return camera && camera.latitude !== null && camera.longitude !== null;
                })
                .map((metric) => {
                    const camera = cameraMap.get(metric.camera_id);
                    const weight = Math.min((metric.vehicle_count || 0) / maxVehicleCount, 1.0);

                    return {
                        camera_id: metric.camera_id,
                        latitude: camera.latitude,
                        longitude: camera.longitude,
                        weight: parseFloat(weight.toFixed(2)),
                        vehicle_count: metric.vehicle_count || 0,
                    };
                });

            return heatmapPoints;
        } catch (err) {
            console.error("MapService.getHeatmap error:", err);
            return [];
        }
    }

    /**
     * Get incident markers — active (unresolved) alerts with map coordinates
     */
    async getIncidents() {
        try {
            const activeAlerts = await this.alertService.listActiveAlerts();
            const cameras = this.adminService.listCameras();

            // Create a map of camera_id -> camera info
            const cameraMap = new Map(cameras.map((c) => [c.camera_id, c]));

            // Build incident markers
            const incidents = activeAlerts.map((alert) => {
                const camera = cameraMap.get(alert.cameraId);

                return {
                    alert_id: alert.id,
                    camera_id: alert.cameraId,
                    latitude: camera ? camera.latitude : null,
                    longitude: camera ? camera.longitude : null,
                    severity: alert.severity,
                    alert_type: alert.type || "congestion",
                    title: alert.title,
                    triggered_at: alert.triggeredAt || new Date().toISOString(),
                };
            });

            return incidents;
        } catch (err) {
            console.error("MapService.getIncidents error:", err);
            return [];
        }
    }
}

module.exports = MapService;
