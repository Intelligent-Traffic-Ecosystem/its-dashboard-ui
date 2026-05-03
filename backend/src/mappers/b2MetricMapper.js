const env = require("../config/env");
const { isStale, toIsoOrNull } = require("../utils/time");

function normalizeCongestionLevel(level) {
  return String(level || "LOW").toUpperCase();
}

function mapB2Metric(metric) {
  const windowEnd = toIsoOrNull(metric?.window_end);

  return {
    cameraId: metric?.camera_id || "unknown",
    windowStart: toIsoOrNull(metric?.window_start),
    windowEnd,
    laneId: metric?.lane_id ?? null,
    vehicleCount: Number(metric?.vehicle_count || 0),
    countsByClass: metric?.counts_by_class || {},
    averageSpeedKmh: Number(metric?.avg_speed_kmh || 0),
    stoppedRatio: Number(metric?.stopped_ratio || 0),
    queueLength: Number(metric?.queue_length || 0),
    congestionLevel: normalizeCongestionLevel(metric?.congestion_level),
    congestionScore: Number(metric?.congestion_score || 0),
    stale: isStale(windowEnd, env.trafficStaleAfterSeconds),
  };
}

function mapB2MetricBatch(payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  return rows.filter(Boolean).map(mapB2Metric);
}

function mapB2Camera(camera) {
  return {
    cameraId: camera?.camera_id || "unknown",
    lastSeen: toIsoOrNull(camera?.last_seen),
    stale: isStale(camera?.last_seen, env.trafficStaleAfterSeconds),
  };
}

module.exports = {
  mapB2Metric,
  mapB2MetricBatch,
  mapB2Camera,
  normalizeCongestionLevel,
};
