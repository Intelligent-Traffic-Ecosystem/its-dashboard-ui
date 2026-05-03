const test = require("node:test");
const assert = require("node:assert/strict");

const { mapB2Metric } = require("../src/mappers/b2MetricMapper");
const { severityFromMetric, shouldCreateActiveAlert } = require("../src/mappers/alertMapper");

test("mapB2Metric normalizes B2 metric fields", () => {
  const metric = mapB2Metric({
    camera_id: "cam_01",
    window_start: "2026-05-02T10:00:00Z",
    window_end: new Date().toISOString(),
    lane_id: 2,
    vehicle_count: 12,
    counts_by_class: { car: 10, bus: 2 },
    avg_speed_kmh: 31.5,
    stopped_ratio: 0.2,
    queue_length: 4,
    congestion_level: "high",
    congestion_score: 82.4,
  });

  assert.equal(metric.cameraId, "cam_01");
  assert.equal(metric.laneId, 2);
  assert.equal(metric.vehicleCount, 12);
  assert.equal(metric.averageSpeedKmh, 31.5);
  assert.equal(metric.congestionLevel, "HIGH");
  assert.equal(metric.congestionScore, 82.4);
  assert.equal(metric.stale, false);
});

test("mapB2Metric handles missing and zero values safely", () => {
  const metric = mapB2Metric({
    camera_id: "cam_02",
    vehicle_count: 0,
    avg_speed_kmh: 0,
    congestion_score: 0,
  });

  assert.equal(metric.cameraId, "cam_02");
  assert.equal(metric.vehicleCount, 0);
  assert.equal(metric.averageSpeedKmh, 0);
  assert.equal(metric.congestionLevel, "LOW");
  assert.equal(metric.stale, true);
});

test("alert mapper derives severity from congestion level and score", () => {
  assert.equal(severityFromMetric({ congestionLevel: "LOW", congestionScore: 10 }), "informational");
  assert.equal(severityFromMetric({ congestionLevel: "MEDIUM", congestionScore: 55 }), "warning");
  assert.equal(severityFromMetric({ congestionLevel: "HIGH", congestionScore: 82 }), "critical");
  assert.equal(severityFromMetric({ congestionLevel: "HIGH", congestionScore: 95 }), "emergency");
  assert.equal(shouldCreateActiveAlert({ congestionLevel: "LOW", congestionScore: 10 }), false);
  assert.equal(shouldCreateActiveAlert({ congestionLevel: "MEDIUM", congestionScore: 55 }), true);
});
