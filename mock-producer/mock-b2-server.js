/**
 * mock-b2-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates the B2 FastAPI service that B3 backend connects to.
 * Serves HTTP REST endpoints + WebSocket streaming on port 18000.
 *
 * Usage:
 *   node mock-b2-server.js
 *
 * Streams a new batch of traffic metrics every 5 seconds over WebSocket,
 * matching the exact schema that b2WebSocketClient.js and b2HttpClient.js expect.
 */

const http = require("http");
const { WebSocketServer } = require("ws");

// ─── Config ──────────────────────────────────────────────────────────────────
const PORT = 18000;
const CAMERAS = ["cam_01", "cam_02", "cam_03", "cam_04"];
const CONGESTION_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
const STREAM_INTERVAL_MS = 5000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function isoNow() {
  return new Date().toISOString();
}

/**
 * Build a single B2-shaped metric for a camera (snake_case — B2 Python output).
 * This is the exact schema the B3 b2MetricMapper.js expects.
 */
function buildMetric(cameraId) {
  const congestionScore = parseFloat(rand(0.1, 0.95).toFixed(3));
  const congestionLevel =
    congestionScore < 0.3
      ? "LOW"
      : congestionScore < 0.55
      ? "MODERATE"
      : congestionScore < 0.8
      ? "HIGH"
      : "CRITICAL";

  const windowEnd = new Date();
  const windowStart = new Date(windowEnd - 5000);

  return {
    camera_id: cameraId,
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
    vehicle_count: randInt(5, 120),
    avg_speed_kmh: parseFloat(rand(10, 90).toFixed(1)),
    congestion_level: congestionLevel,
    congestion_score: congestionScore,
    lane_id: null,
  };
}

function buildAllMetrics() {
  return CAMERAS.map(buildMetric);
}

// Build a richer history for a camera (past 60 metrics / 5 min windows)
function buildHistory(cameraId, count = 60) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const wEnd = new Date(now - i * 5000);
    const wStart = new Date(wEnd - 5000);
    const score = parseFloat(rand(0.1, 0.95).toFixed(3));
    return {
      camera_id: cameraId,
      window_start: wStart.toISOString(),
      window_end: wEnd.toISOString(),
      vehicle_count: randInt(5, 120),
      avg_speed_kmh: parseFloat(rand(10, 90).toFixed(1)),
      congestion_level:
        score < 0.3 ? "LOW" : score < 0.55 ? "MODERATE" : score < 0.8 ? "HIGH" : "CRITICAL",
      congestion_score: score,
      lane_id: null,
    };
  }).reverse();
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // GET /health
  if (pathname === "/health" && req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok", kafka: "ok", postgres: "ok" }));
    return;
  }

  // GET /cameras
  if (pathname === "/cameras" && req.method === "GET") {
    const cameras = CAMERAS.map((id) => ({
      camera_id: id,
      road_segment: `Segment-${id.split("_")[1]}`,
      latitude: parseFloat(rand(6.85, 6.95).toFixed(6)),
      longitude: parseFloat(rand(79.85, 79.95).toFixed(6)),
      active: true,
    }));
    res.writeHead(200);
    res.end(JSON.stringify(cameras));
    return;
  }

  // GET /congestion/current
  if (pathname === "/congestion/current" && req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify(buildAllMetrics()));
    return;
  }

  // GET /metrics/current?camera_id=...
  if (pathname === "/metrics/current" && req.method === "GET") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) {
      res.writeHead(400);
      res.end(JSON.stringify({ detail: "camera_id is required" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(buildMetric(cameraId)));
    return;
  }

  // GET /metrics/history?camera_id=...&from=...&to=...
  if (pathname === "/metrics/history" && req.method === "GET") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) {
      res.writeHead(400);
      res.end(JSON.stringify({ detail: "camera_id is required" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(buildHistory(cameraId)));
    return;
  }

  // 404 fallback
  res.writeHead(404);
  res.end(JSON.stringify({ detail: "Not found" }));
});

// ─── WebSocket Server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws/metrics" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const cameraFilter = url.searchParams.get("camera_id") || null;
  console.log(`[WS] Client connected${cameraFilter ? ` (camera_id=${cameraFilter})` : ""}`);

  ws.on("close", () => console.log("[WS] Client disconnected"));
});

// Stream metrics to all connected WS clients every 5 seconds
setInterval(() => {
  const metrics = buildAllMetrics();
  const payload = JSON.stringify(metrics);

  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  });

  const clients = wss.clients.size;
  if (clients > 0) {
    console.log(`[WS] Pushed ${metrics.length} metrics to ${clients} client(s)`);
  }
}, STREAM_INTERVAL_MS);

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🟢  Mock B2 server running on http://localhost:${PORT}`);
  console.log(`   REST endpoints:`);
  console.log(`     GET /health`);
  console.log(`     GET /cameras`);
  console.log(`     GET /congestion/current`);
  console.log(`     GET /metrics/current?camera_id=cam_01`);
  console.log(`     GET /metrics/history?camera_id=cam_01&from=<ISO>&to=<ISO>`);
  console.log(`   WebSocket:`);
  console.log(`     ws://localhost:${PORT}/ws/metrics`);
  console.log(`     ws://localhost:${PORT}/ws/metrics?camera_id=cam_01`);
  console.log(`\n   Streaming metrics every ${STREAM_INTERVAL_MS / 1000}s...\n`);
});
