const env = {
  port: Number(process.env.PORT || 5000),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  b2ApiBaseUrl: process.env.B2_API_BASE_URL || "http://localhost:18000",
  b2AdminToken: process.env.B2_ADMIN_TOKEN || "",
  b2WsUrl: process.env.B2_WS_URL || "ws://localhost:18000/ws/metrics",
  b2WsLanesUrl: process.env.B2_WS_LANES_URL || "ws://localhost:18000/ws/metrics/lanes",
  b2WsEventsUrl: process.env.B2_WS_EVENTS_URL || "ws://localhost:18000/ws/events",
  b2RequestTimeoutMs: Number(process.env.B2_REQUEST_TIMEOUT_MS || 5000),
  b2WsReconnectMs: Number(process.env.B2_WS_RECONNECT_MS || 3000),
  trafficStaleAfterSeconds: Number(process.env.TRAFFIC_STALE_AFTER_SECONDS || 30),
};

module.exports = env;
