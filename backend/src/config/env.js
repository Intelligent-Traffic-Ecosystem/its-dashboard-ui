const env = {
  port: Number(process.env.PORT || 5000),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Primary B2 (real FastAPI service).
  b2ApiBaseUrl: process.env.B2_API_BASE_URL || "http://localhost:18000",
  b2AdminToken: process.env.B2_ADMIN_TOKEN || "",
  b2WsUrl: process.env.B2_WS_URL || "ws://localhost:18000/ws/metrics",
  b2WsLanesUrl: process.env.B2_WS_LANES_URL || "ws://localhost:18000/ws/metrics/lanes",
  b2WsEventsUrl: process.env.B2_WS_EVENTS_URL || "ws://localhost:18000/ws/events",
  b2RequestTimeoutMs: Number(process.env.B2_REQUEST_TIMEOUT_MS || 5000),
  b2WsReconnectMs: Number(process.env.B2_WS_RECONNECT_MS || 3000),
  trafficStaleAfterSeconds: Number(process.env.TRAFFIC_STALE_AFTER_SECONDS || 30),

  // Fallback (mock B2 server bundled with B3 — mock-producer/full-mock-b2-server.js).
  // When unset, the router runs without fallback and behaves like the original BFF.
  b2FallbackApiBaseUrl: process.env.B2_FALLBACK_API_BASE_URL || "",
  b2FallbackWsUrl: process.env.B2_FALLBACK_WS_URL || "",
  b2FallbackWsLanesUrl: process.env.B2_FALLBACK_WS_LANES_URL || "",
  b2FallbackWsEventsUrl: process.env.B2_FALLBACK_WS_EVENTS_URL || "",

  // Health-probe tuning for UpstreamRouter.
  upstreamProbeIntervalMs: Number(process.env.UPSTREAM_PROBE_INTERVAL_MS || 10_000),
  upstreamProbeTimeoutMs: Number(process.env.UPSTREAM_PROBE_TIMEOUT_MS || 3_000),
  upstreamFailureThreshold: Number(process.env.UPSTREAM_FAILURE_THRESHOLD || 3),
  upstreamRecoveryThreshold: Number(process.env.UPSTREAM_RECOVERY_THRESHOLD || 3),
  upstreamCooldownMs: Number(process.env.UPSTREAM_COOLDOWN_MS || 30_000),
};

module.exports = env;
