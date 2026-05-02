const TrafficDataProvider = require("./trafficDataProvider");
const { B2HttpClient } = require("../clients/b2HttpClient");
const B2WebSocketClient = require("../clients/b2WebSocketClient");
const { mapB2Camera, mapB2Metric, mapB2MetricBatch } = require("../mappers/b2MetricMapper");

class B2TrafficDataAdapter extends TrafficDataProvider {
  constructor({ httpClient, websocketClient }) {
    super();
    this.httpClient = httpClient;
    this.websocketClient = websocketClient;
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
  });
}

module.exports = {
  B2TrafficDataAdapter,
  createB2TrafficDataAdapter,
};
