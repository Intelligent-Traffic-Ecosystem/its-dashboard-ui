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

// Derives overall congestion level from a 0–1 average score using B2 default thresholds.
function _scoreToLevel(score) {
  const s = Number(score || 0);
  if (s < 0.3) return "LOW";
  if (s < 0.55) return "MODERATE";
  if (s < 0.8) return "HIGH";
  return "SEVERE";
}

function mapB2DashboardSummary(data) {
  const score = Number(data?.average_congestion_score_5m || 0);
  return {
    total_incidents_24h: Number(data?.total_incidents_24h || 0),
    total_vehicles: Number(data?.total_vehicles_last_window || 0),
    total_cameras_active: Number(data?.total_cameras_active || 0),
    avg_speed_kmh: Number(data?.average_speed_kmh || 0),
    overall_congestion_level: _scoreToLevel(score),
    overall_congestion_score: score,
    active_alerts: Number(data?.active_alerts || 0),
    congestion_breakdown: data?.congestion_breakdown || {},
    worst_camera: data?.worst_camera || null,
    last_updated: data?.generated_at || new Date().toISOString(),
  };
}

function mapB2DashboardEvent(event) {
  const vehicleClass = event?.class || event?.vehicle_class || "unknown";
  const cameraId = event?.camera_id || "unknown";
  return {
    id: `${cameraId}-${event?.vehicle_id || event?.timestamp}`,
    cameraId,
    camera_id: cameraId,
    timestamp: event?.timestamp || new Date().toISOString(),
    vehicleClass,
    vehicle_class: vehicleClass,
    speedKmh: Number(event?.speed_kmh || 0),
    speed_kmh: Number(event?.speed_kmh || 0),
    laneId: event?.lane_id ?? null,
    lane_id: event?.lane_id ?? null,
    confidence: Number(event?.confidence || 0),
  };
}

function mapB2DashboardEventBatch(payload) {
  const rows = Array.isArray(payload) ? payload : [];
  return rows.filter(Boolean).map(mapB2DashboardEvent);
}

// Maps B2 alert severity (congestion level strings) to B3 UI severity labels.
function mapB2AlertSeverity(severity) {
  switch (String(severity || "LOW").toUpperCase()) {
    case "SEVERE":   return "emergency";
    case "HIGH":     return "critical";
    case "MODERATE": return "warning";
    default:         return "informational";
  }
}

// Maps a single B2 AlertOutput (snake_case) to a B3 alert object.
function mapB2AlertOutput(alert) {
  const id = String(alert?.id ?? "");
  return {
    id,
    alertId: id,
    type: alert?.alert_type || "congestion",
    severity: mapB2AlertSeverity(alert?.severity),
    cameraId: alert?.camera_id || "unknown",
    camera_id: alert?.camera_id || "unknown",
    roadSegment: alert?.road_segment || null,
    road_segment: alert?.road_segment || null,
    title: alert?.title || "",
    description: alert?.message || "",
    message: alert?.message || "",
    congestionLevel: alert?.congestion_level || null,
    congestionScore: alert?.congestion_score ?? null,
    status: alert?.acknowledged ? "acknowledged" : "active",
    timestamp: alert?.triggered_at || null,
    triggeredAt: alert?.triggered_at || null,
    resolvedAt: alert?.resolved_at || null,
    acknowledgedBy: alert?.acknowledged_by || null,
    acknowledgedAt: alert?.acknowledged_at || null,
  };
}

function mapB2AlertOutputBatch(alerts) {
  return Array.isArray(alerts) ? alerts.filter(Boolean).map(mapB2AlertOutput) : [];
}

// Maps B2 /api/analytics/metrics response to the shape the B3 frontend expects.
function mapB2AnalyticsMetrics(data) {
  const incidents = data?.incidents || {};
  const incidentPie = [];
  if (Number(incidents.high || 0) > 0) {
    incidentPie.push({ severity: "HIGH", count: Number(incidents.high) });
  }
  if (Number(incidents.critical || 0) > 0) {
    // B2 calls SEVERE-level windows "critical" in the incidents summary
    incidentPie.push({ severity: "SEVERE", count: Number(incidents.critical) });
  }
  if (incidentPie.length === 0) {
    incidentPie.push({ severity: "HIGH", count: 0 }, { severity: "SEVERE", count: 0 });
  }

  return {
    range_start: data?.start || null,
    range_end: data?.end || null,
    avg_congestion_score: Number(data?.average_congestion || 0),
    peak_hour_distribution: (data?.peak_hour_trends || []).map((row) => ({
      hour: Number(row.hour),
      avg_vehicle_count: Number(row.vehicle_count || 0),
      avg_congestion_score: Number(row.average_congestion || 0),
    })),
    top_segments: (data?.top_segments || []).map((seg) => ({
      // B2 segment_key = road_segment OR camera_id — use for both fields
      camera_id: seg.camera_id || "unknown",
      road_segment: seg.camera_id || null,
      avg_congestion_score: Number(seg.average_congestion || 0),
      // Each HIGH/SEVERE window ≈ 5-minute window; incident_count counts both levels
      severe_minutes: Number(seg.incident_count || 0) * 5,
    })),
    incident_pie: incidentPie,
  };
}

module.exports = {
  mapB2Metric,
  mapB2MetricBatch,
  mapB2Camera,
  normalizeCongestionLevel,
  mapB2DashboardSummary,
  mapB2DashboardEvent,
  mapB2DashboardEventBatch,
  mapB2AnalyticsMetrics,
  mapB2AlertSeverity,
  mapB2AlertOutput,
  mapB2AlertOutputBatch,
};
