const { getCoordinateForCamera } = require("../mappers/mapFeatureMapper");

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
     * Best-effort camera lookup. The admin endpoint requires X-Admin-Token,
     * which the public map render doesn't have — so a 401/403 is normal in
     * the public flow and must not zero out the whole heatmap. Falls back
     * to the static camera↔coordinate map in mapFeatureMapper.
     */
    async _safeCameraMap() {
        try {
            const cameras = await this.adminService.listCameras();
            return new Map(cameras.map((c) => [c.camera_id || c.cameraId, c]));
        } catch {
            return new Map();
        }
    }

    /**
     * Get heatmap data — vehicle density points for map visualization
     * Uses latest metric per camera within last 5 minutes
     */
    async getHeatmap() {
        try {
            const currentMetrics = await this.trafficService.getCurrentCongestion();
            const cameraMap = await this._safeCameraMap();

            const maxVehicleCount = Math.max(...currentMetrics.map((m) => m.vehicleCount || 0), 1);

            const heatmapPoints = currentMetrics
                .map((metric) => {
                    const camera = cameraMap.get(metric.cameraId);
                    const fallback = getCoordinateForCamera(metric.cameraId);
                    const latitude = camera?.latitude ?? camera?.lat ?? fallback.lat;
                    const longitude = camera?.longitude ?? camera?.lng ?? fallback.lng;
                    const weight = Math.min((metric.vehicleCount || 0) / maxVehicleCount, 1.0);

                    return {
                        camera_id: metric.cameraId,
                        cameraId: metric.cameraId,
                        latitude,
                        longitude,
                        lat: latitude,
                        lng: longitude,
                        weight: parseFloat(weight.toFixed(2)),
                        vehicle_count: metric.vehicleCount || 0,
                        vehicleCount: metric.vehicleCount || 0,
                        congestionScore: metric.congestionScore || 0,
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
            const cameraMap = await this._safeCameraMap();

            const incidents = activeAlerts.map((alert) => {
                const camera = cameraMap.get(alert.cameraId);
                const fallback = getCoordinateForCamera(alert.cameraId);
                const latitude = camera?.latitude ?? camera?.lat ?? fallback.lat;
                const longitude = camera?.longitude ?? camera?.lng ?? fallback.lng;

                return {
                    alert_id: alert.id,
                    alertId: alert.id,
                    camera_id: alert.cameraId,
                    cameraId: alert.cameraId,
                    latitude,
                    longitude,
                    lat: latitude,
                    lng: longitude,
                    severity: alert.severity,
                    alert_type: alert.type || "congestion",
                    alertType: alert.type || "congestion",
                    title: alert.title,
                    message: alert.description,
                    timestamp: alert.timestamp || alert.triggeredAt || new Date().toISOString(),
                    triggered_at: alert.timestamp || alert.triggeredAt || new Date().toISOString(),
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
