const { severityFromMetric } = require("./alertMapper");

// Real Colombo District intersections — matched to demo-b2-server.js camera registry
const CAMERA_COORDINATES = {
  cam_01: { lat: 6.8900, lng: 79.8553 }, // Galle Road – Bambalapitiya
  cam_02: { lat: 6.9549, lng: 79.9213 }, // Kandy Road – Kelaniya Junction
  cam_03: { lat: 6.9344, lng: 79.8428 }, // Colombo Fort – Main Street
  cam_04: { lat: 6.8726, lng: 79.8989 }, // Nugegoda Junction – High Level Rd
  cam_05: { lat: 6.9083, lng: 79.9022 }, // Rajagiriya Flyover
  cam_06: { lat: 6.8472, lng: 79.9261 }, // Maharagama Junction – A4
  cam_07: { lat: 6.9108, lng: 79.8699 }, // Borella – D.S. Senanayake Mawatha
  cam_08: { lat: 6.8729, lng: 79.8588 }, // Wellawatte – Galle Road South
};

function fallbackCoordinate(cameraId) {
  const numeric = Number(String(cameraId).replace(/\D/g, "")) || 0;
  return {
    lat: 6.02 + (numeric % 8) * 0.006,
    lng: 80.21 + (numeric % 6) * 0.007,
  };
}

function getCoordinateForCamera(cameraId) {
  return CAMERA_COORDINATES[cameraId] || fallbackCoordinate(cameraId);
}

function mapMetricToLocation(metric) {
  const coordinate = getCoordinateForCamera(metric.cameraId);
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
  getCoordinateForCamera,
  mapMetricToLocation,
};
