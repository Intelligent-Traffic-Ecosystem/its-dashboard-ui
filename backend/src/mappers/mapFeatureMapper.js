const { severityFromMetric } = require("./alertMapper");

const CAMERA_COORDINATES = {
  cam_01: { lat: 6.0248, lng: 80.2172 },
  cam_02: { lat: 6.0545, lng: 80.2209 },
  cam_03: { lat: 6.0182, lng: 80.2477 },
  cam_04: { lat: 6.0358, lng: 80.2291 },
};

function fallbackCoordinate(cameraId) {
  const numeric = Number(String(cameraId).replace(/\D/g, "")) || 0;
  return {
    lat: 6.02 + (numeric % 8) * 0.006,
    lng: 80.21 + (numeric % 6) * 0.007,
  };
}

function mapMetricToLocation(metric) {
  const coordinate = CAMERA_COORDINATES[metric.cameraId] || fallbackCoordinate(metric.cameraId);
  const severity = severityFromMetric(metric);

  return {
    id: `CAM-${metric.cameraId}`,
    type: severity === "informational" ? "sensor" : "incident",
    severity: severity === "informational" ? "info" : severity,
    lat: coordinate.lat,
    lng: coordinate.lng,
    title: `Traffic camera ${metric.cameraId}`,
    description: `${metric.congestionLevel} congestion, ${metric.averageSpeedKmh.toFixed(1)} km/h average speed.`,
    status: metric.stale ? "stale" : "active",
    timestamp: metric.windowEnd || metric.windowStart || new Date().toISOString(),
    details: {
      vehicleCount: metric.vehicleCount,
      avgSpeedKmh: metric.averageSpeedKmh,
      congestionScore: metric.congestionScore,
      queueLength: metric.queueLength,
    },
  };
}

module.exports = {
  mapMetricToLocation,
};
