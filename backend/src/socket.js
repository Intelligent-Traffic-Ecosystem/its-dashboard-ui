const { mapMetricToAlert, shouldCreateActiveAlert } = require("./mappers/alertMapper");
const { mapB2MetricBatch } = require("./mappers/b2MetricMapper");

/**
 * Socket.io event reference (emitted to frontend clients):
 *
 * traffic:metrics          — array of TrafficMetric (camelCase), all cameras, every ~5s
 * traffic:congestion       — same payload as traffic:metrics (alias kept for backwards compat)
 * traffic:lane_metrics     — array of lane-level TrafficMetric, every ~5s
 * map:heatmap              — { ts, data: HeatmapPoint[] } rolling 5-min heatmap, every ~10s
 * alert:new                — single alert object when a camera flips HIGH/SEVERE
 * admin:broadcast          — { ts, data: { severity, title, message } } operator notification
 *
 * Client → server room subscriptions:
 *   traffic:subscribe        { cameraId }  — join camera-specific metric room
 *   traffic:unsubscribe      { cameraId }  — leave camera-specific metric room
 *   lanes:subscribe          { cameraId }  — join camera-specific lane room (or omit for all lanes)
 *   lanes:unsubscribe        { cameraId }  — leave camera-specific lane room
 */
function createSocketServer(io, { trafficDataProvider }) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Per-camera metric room
    socket.on("traffic:subscribe", ({ cameraId } = {}) => {
      if (cameraId) socket.join(`camera:${cameraId}`);
    });
    socket.on("traffic:unsubscribe", ({ cameraId } = {}) => {
      if (cameraId) socket.leave(`camera:${cameraId}`);
    });

    // Per-camera lane room
    socket.on("lanes:subscribe", ({ cameraId } = {}) => {
      socket.join(cameraId ? `lanes:${cameraId}` : "lanes:all");
    });
    socket.on("lanes:unsubscribe", ({ cameraId } = {}) => {
      socket.leave(cameraId ? `lanes:${cameraId}` : "lanes:all");
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // --- Feed 1: WS /ws/metrics (camera-wide metrics) ---
  const unsubscribeMetrics = trafficDataProvider.subscribeToMetrics((metrics) => {
    if (!metrics.length) return;

    io.emit("traffic:metrics", metrics);
    io.emit("traffic:congestion", metrics);

    metrics.forEach((metric) => {
      io.to(`camera:${metric.cameraId}`).emit("traffic:metrics", [metric]);

      if (shouldCreateActiveAlert(metric)) {
        io.emit("alert:new", mapMetricToAlert(metric));
      }
    });
  });

  // --- Feed 2: WS /ws/metrics/lanes (per-lane metrics) ---
  const unsubscribeLanes = trafficDataProvider.subscribeLaneMetrics((metrics) => {
    if (!metrics.length) return;

    // Broadcast to clients in any per-camera lane room
    metrics.forEach((metric) => {
      io.to(`lanes:${metric.cameraId}`).emit("traffic:lane_metrics", [metric]);
    });

    // Broadcast full batch to clients subscribed to all lanes
    io.to("lanes:all").emit("traffic:lane_metrics", metrics);
  });

  // --- Feed 3: WS /ws/events (unified B2 event bus) ---
  const unsubscribeEvents = trafficDataProvider.subscribeToEvents((envelope) => {
    const { event, ts, data } = envelope;

    switch (event) {
      case "traffic_metrics_update":
        // Map raw B2 snake_case metrics to camelCase before forwarding.
        // Clients preferring the typed unified channel can listen to traffic:metrics_update
        // instead of (or in addition to) traffic:metrics.
        io.emit("traffic:metrics_update", {
          ts,
          data: mapB2MetricBatch(Array.isArray(data) ? data : []),
        });
        break;

      case "heatmap_update":
        io.emit("map:heatmap", { ts, data });
        break;

      case "new_alert":
        // B2 alert payload: { camera_id, severity, score, vehicle_count, window_end }
        io.emit("alert:new", {
          id: `ALERT-${data.camera_id}-${data.window_end || ts}`,
          type: "congestion",
          cameraId: data.camera_id,
          severity: _b2SeverityToB3(data.severity, data.score),
          status: "active",
          timestamp: data.window_end || ts,
          details: {
            congestionScore: data.score,
            vehicleCount: data.vehicle_count,
          },
        });
        break;

      case "admin_broadcast":
        io.emit("admin:broadcast", { ts, data });
        break;

      default:
        break;
    }
  });

  return {
    unsubscribe: () => {
      unsubscribeMetrics();
      unsubscribeLanes();
      unsubscribeEvents();
    },
  };
}

// Maps B2 congestion level + score to a B3 alert severity string.
function _b2SeverityToB3(level, score) {
  const s = Number(score || 0);
  const l = String(level || "LOW").toUpperCase();
  if (s >= 0.9 || l === "SEVERE") return "emergency";
  if (l === "HIGH") return "critical";
  if (l === "MODERATE") return "warning";
  return "informational";
}

module.exports = createSocketServer;
