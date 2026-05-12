const TrafficDataProvider = require("./trafficDataProvider");
const { B2HttpClient } = require("../clients/b2HttpClient");
const B2WebSocketClient = require("../clients/b2WebSocketClient");
const env = require("../config/env");
const {
  mapB2Camera,
  mapB2Metric,
  mapB2MetricBatch,
  mapB2DashboardSummary,
  mapB2DashboardEventBatch,
  mapB2AnalyticsMetrics,
  mapB2AlertOutputBatch,
} = require("../mappers/b2MetricMapper");

class B2TrafficDataAdapter extends TrafficDataProvider {
  constructor({ httpClient, websocketClient, laneMetricsClient, eventsClient }) {
    super();
    this.httpClient = httpClient;
    this.websocketClient = websocketClient;
    this.laneMetricsClient = laneMetricsClient;
    this.eventsClient = eventsClient;
  }

  async getHealth() {
    return this.httpClient.get("/health");
  }

  async listCameras() {
    const cameras = await this.httpClient.get("/cameras");
    return Array.isArray(cameras) ? cameras.map(mapB2Camera) : [];
  }

  async getCurrentMetric(cameraId) {
    const metric = await this.httpClient.get("/metrics/current", { camera_id: cameraId });
    return mapB2Metric(metric);
  }

  async getMetricHistory(cameraId, from, to) {
    const metrics = await this.httpClient.get("/metrics/history", {
      camera_id: cameraId,
      from,
      to,
    });
    return mapB2MetricBatch(metrics);
  }

  async getCurrentCongestion() {
    const metrics = await this.httpClient.get("/congestion/current");
    return mapB2MetricBatch(metrics);
  }

  subscribeToMetrics(onMetricBatch) {
    return this.websocketClient.subscribe((payload) => {
      onMetricBatch(mapB2MetricBatch(payload));
    });
  }

  async getDashboardSummary() {
    const data = await this.httpClient.get("/api/dashboard/summary");
    return mapB2DashboardSummary(data);
  }

  async getDashboardEvents(limit = 10) {
    const data = await this.httpClient.get("/api/dashboard/events", { limit });
    return mapB2DashboardEventBatch(data);
  }

  // GET /api/alerts/history — filters: camera_id, severity, road_segment, type, from, to
  async getAlertHistory(params = {}) {
    const query = {};
    if (params.camera_id) query.camera_id = params.camera_id;
    if (params.severity)   query.severity = params.severity;
    if (params.road_segment) query.road_segment = params.road_segment;
    if (params.type)       query.type = params.type;      // B2 alias for alert_type
    if (params.from)       query.from = params.from;
    if (params.to)         query.to = params.to;
    const data = await this.httpClient.get("/api/alerts/history", query);
    return mapB2AlertOutputBatch(data);
  }

  // POST /api/alerts/{id}/acknowledge — requires B2 admin token
  async acknowledgeAlert(alertId, userId) {
    return this.httpClient.post(
      `/api/alerts/${alertId}/acknowledge`,
      { admin_id: userId },
      {
        "X-Admin-Token": env.b2AdminToken,
        "X-Admin-User": userId,
      }
    );
  }

  // GET /api/alerts/export — proxied CSV stream
  async streamAlertExport(params = {}) {
    const query = {};
    if (params.camera_id)    query.camera_id = params.camera_id;
    if (params.severity)     query.severity = params.severity;
    if (params.road_segment) query.road_segment = params.road_segment;
    if (params.type)         query.type = params.type;
    if (params.from)         query.from = params.from;
    if (params.to)           query.to = params.to;
    return this.httpClient.streamGet("/api/alerts/export", query);
  }

  // GET /api/predict/congestion — ST-GCN forecast for one camera
  async getCongestionPrediction(cameraId, horizonMinutes, lookbackMinutes) {
    const query = { camera_id: cameraId };
    if (horizonMinutes != null) query.horizon_minutes = horizonMinutes;
    if (lookbackMinutes != null) query.lookback_minutes = lookbackMinutes;
    return this.httpClient.get("/api/predict/congestion", query);
  }

  // WS /ws/metrics/lanes — per-lane metric stream
  subscribeLaneMetrics(onMetricBatch) {
    return this.laneMetricsClient.subscribe((payload) => {
      onMetricBatch(mapB2MetricBatch(payload));
    });
  }

  // GET /api/analytics/metrics — B2 uses start/end; returns AnalyticsMetricsResponse
  async getAnalyticsMetrics(start, end) {
    const data = await this.httpClient.get("/api/analytics/metrics", { start, end });
    return mapB2AnalyticsMetrics(data);
  }

  // GET /api/analytics/report/pdf — proxied as raw binary Response
  async streamAnalyticsReportPdf(start, end) {
    return this.httpClient.streamGet("/api/analytics/report/pdf", { start, end });
  }

  // WS /ws/events — unified event bus: heatmap_update, new_alert, admin_broadcast
  subscribeToEvents(onEvent) {
    return this.eventsClient.subscribe((envelope) => {
      // envelope shape: { event: string, ts: string, data: any }
      if (envelope && envelope.event) {
        onEvent(envelope);
      }
    });
  }
}

function createB2TrafficDataAdapter(env) {
  return new B2TrafficDataAdapter({
    httpClient: new B2HttpClient({
      baseUrl: env.b2ApiBaseUrl,
      timeoutMs: env.b2RequestTimeoutMs,
    }),
    websocketClient: new B2WebSocketClient({
      url: env.b2WsUrl,
      reconnectMs: env.b2WsReconnectMs,
    }),
    laneMetricsClient: new B2WebSocketClient({
      url: env.b2WsLanesUrl,
      reconnectMs: env.b2WsReconnectMs,
    }),
    eventsClient: new B2WebSocketClient({
      url: env.b2WsEventsUrl,
      reconnectMs: env.b2WsReconnectMs,
    }),
  });
}

module.exports = {
  B2TrafficDataAdapter,
  createB2TrafficDataAdapter,
};
