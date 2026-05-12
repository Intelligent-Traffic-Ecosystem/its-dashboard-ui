/**
 * demo-b2-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Continuous mock B2 server for dashboard demo.
 *
 *  • Sri Lanka – Colombo District camera locations (real coordinates)
 *  • Realistic time-of-day traffic patterns (rush hours, night quiet)
 *  • Gradual congestion drift — values don't jump randomly each tick
 *  • WebSocket streaming every 5 s (matches real B2 Flink window)
 *  • No database — pure in-memory state
 *
 * Run:
 *   node mock-producer/demo-b2-server.js
 */

"use strict";

const http = require("http");
const { WebSocketServer } = require("ws");

// ─── Sri Lanka camera registry ────────────────────────────────────────────────
// Real Colombo District intersections / road segments
const CAMERAS = [
  { camera_id: "cam_01", road_segment: "Galle Road – Bambalapitiya",        lat: 6.8900, lng: 79.8553 },
  { camera_id: "cam_02", road_segment: "Kandy Road – Kelaniya Junction",    lat: 6.9549, lng: 79.9213 },
  { camera_id: "cam_03", road_segment: "Colombo Fort – Main Street",        lat: 6.9344, lng: 79.8428 },
  { camera_id: "cam_04", road_segment: "Nugegoda Junction – High Level Rd", lat: 6.8726, lng: 79.8989 },
  { camera_id: "cam_05", road_segment: "Rajagiriya Flyover",                lat: 6.9083, lng: 79.9022 },
  { camera_id: "cam_06", road_segment: "Maharagama Junction – A4",          lat: 6.8472, lng: 79.9261 },
  { camera_id: "cam_07", road_segment: "Borella – D.S. Senanayake Mawatha", lat: 6.9108, lng: 79.8699 },
  { camera_id: "cam_08", road_segment: "Wellawatte – Galle Road South",     lat: 6.8729, lng: 79.8588 },
];

const PORT = 18000;
const STREAM_INTERVAL_MS = 5000;

// ─── State — each camera has a smoothly-drifting congestion score ─────────────
const state = {};
CAMERAS.forEach((cam) => {
  state[cam.camera_id] = {
    score:    Math.random() * 0.5 + 0.1,   // start between 0.1 – 0.6
    velocity: (Math.random() - 0.5) * 0.02, // rate of change per tick
  };
});

// ─── Pre-built 24-hour history cache ─────────────────────────────────────────
// 288 points per camera = 24h at one point per 5 minutes
const HISTORY_CACHE = {};

function buildHistoryCache() {
  const now  = Date.now();
  const POINTS = 288; // 24h × 12 points/h
  const STEP_MS = 5 * 60 * 1000;

  CAMERAS.forEach((cam) => {
    // Each camera gets its own random base + variance so cameras look different
    const base = Math.random() * 0.3 + 0.15;
    let score = base;

    HISTORY_CACHE[cam.camera_id] = Array.from({ length: POINTS }, (_, i) => {
      const wEnd   = new Date(now - (POINTS - 1 - i) * STEP_MS);
      const wStart = new Date(wEnd - STEP_MS);

      // Apply time-of-day multiplier based on IST hour
      const istHour = new Date(wEnd.getTime() + 5.5 * 3600000).getUTCHours();
      const istMin  = new Date(wEnd.getTime() + 5.5 * 3600000).getUTCMinutes();
      const h = istHour + istMin / 60;
      const mul =
        (h >= 7 && h <= 9.5)    ? 1.65 :
        (h >= 16.5 && h <= 19.5) ? 1.55 :
        (h >= 22 || h < 5)      ? 0.30 :
        (h >= 12 && h <= 13)    ? 0.75 : 1.0;

      // Random drift
      score += (Math.random() - 0.5) * 0.06;
      score  = clamp(score * mul, 0.05, 0.97);
      // Pull back toward base to avoid permanent extremes
      score  = score * 0.9 + base * 0.1;

      const level =
        score < 0.25 ? "LOW" : score < 0.5 ? "MODERATE" : score < 0.75 ? "HIGH" : "SEVERE";
      const bc = Math.round(score * 280 * mul + 20);
      const avgSpeed = parseFloat(clamp(65 - score * 55 + rand(-3, 3), 8, 65).toFixed(1));

      return {
        camera_id:        cam.camera_id,
        window_start:     wStart.toISOString(),
        window_end:       wEnd.toISOString(),
        vehicle_count:    Math.max(1, bc + randInt(-8, 8)),
        avg_speed_kmh:    avgSpeed,
        congestion_level: level,
        congestion_score: parseFloat(score.toFixed(4)),
        stopped_ratio:    parseFloat(clamp(score * 0.4, 0, 0.9).toFixed(3)),
        queue_length:     score > 0.6 ? randInt(2, 14) : 0,
        counts_by_class:  {
          car:           Math.max(1, Math.round(bc * rand(0.50, 0.65))),
          motorcycle:    Math.max(0, Math.round(bc * rand(0.15, 0.25))),
          bus:           randInt(1, 8),
          truck:         randInt(0, 4),
          three_wheeler: randInt(2, 15),
        },
        lane_id: null,
      };
    });
  });
}

buildHistoryCache();
// Refresh cache every hour so history stays fresh during long demo sessions
setInterval(buildHistoryCache, 60 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, lo, hi)  { return Math.max(lo, Math.min(hi, v)); }

/**
 * Sri Lanka rush-hour multiplier.
 * Peak: 07:00–09:30 and 16:30–19:30 (IST/+5:30)
 * Night quiet: 22:00–05:00
 */
function timeMultiplier() {
  // Use local IST hour
  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const h = nowIST.getUTCHours() + nowIST.getUTCMinutes() / 60;
  if (h >= 7 && h <= 9.5)  return 1.6;   // morning rush
  if (h >= 16.5 && h <= 19.5) return 1.5; // evening rush
  if (h >= 22 || h < 5)    return 0.35;  // night quiet
  if (h >= 12 && h <= 13)  return 0.8;   // lunch dip
  return 1.0;                              // normal
}

/** Advance state for one camera with smooth Brownian drift. */
function tickCamera(cameraId) {
  const s = state[cameraId];
  const mul = timeMultiplier();

  // Random walk on velocity
  s.velocity += (Math.random() - 0.5) * 0.008;
  s.velocity  = clamp(s.velocity, -0.04, 0.04);

  // Apply velocity
  s.score = clamp(s.score + s.velocity * mul, 0.05, 0.98);

  return s.score;
}

/**
 * Build one B2-shaped metric for a camera (snake_case).
 * Matches exactly what b2MetricMapper.js and b2HttpClient.js expect.
 */
function buildMetric(cam) {
  const score = tickCamera(cam.camera_id);
  const level =
    score < 0.25 ? "LOW"
    : score < 0.5 ? "MODERATE"
    : score < 0.75 ? "HIGH"
    : "SEVERE";

  const mul = timeMultiplier();
  // Sri Lankan roads: typical peak ~300-400 vehicles / 5 min, night ~30
  const baseCount = Math.round(score * 280 * mul + 20);
  // Avg speed inversely proportional to congestion (city range 10–60 km/h)
  const avgSpeed  = parseFloat(clamp(65 - score * 55 + rand(-5, 5), 8, 65).toFixed(1));

  const wEnd   = new Date();
  const wStart = new Date(wEnd - 5000);

  return {
    camera_id:        cam.camera_id,
    window_start:     wStart.toISOString(),
    window_end:       wEnd.toISOString(),
    vehicle_count:    baseCount + randInt(-5, 5),
    avg_speed_kmh:    avgSpeed,
    congestion_level: level,
    congestion_score: parseFloat(score.toFixed(4)),
    stopped_ratio:    parseFloat(clamp(score * 0.4, 0, 0.9).toFixed(3)),
    queue_length:     score > 0.6 ? randInt(2, 12) : 0,
    counts_by_class:  {
      car:             randInt(Math.floor(baseCount * 0.5), Math.floor(baseCount * 0.7)),
      motorcycle:      randInt(Math.floor(baseCount * 0.15), Math.floor(baseCount * 0.25)),
      bus:             randInt(1, 8),
      truck:           randInt(0, 4),
      three_wheeler:   randInt(2, 15),
    },
    lane_id:          null,
  };
}

function buildAllMetrics() {
  return CAMERAS.map(buildMetric);
}

/** Generate ~60 history points (5 min windows going 5 h back) */
function buildHistory(cameraId, count = 60) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const wEnd = new Date(now - i * 5000);
    const score = parseFloat(rand(0.1, 0.9).toFixed(4));
    const level = score < 0.25 ? "LOW" : score < 0.5 ? "MODERATE" : score < 0.75 ? "HIGH" : "SEVERE";
    const bc = Math.round(score * 280 + 20);
    return {
      camera_id:        cameraId,
      window_start:     new Date(wEnd - 5000).toISOString(),
      window_end:       wEnd.toISOString(),
      vehicle_count:    bc + randInt(-5, 5),
      avg_speed_kmh:    parseFloat(clamp(65 - score * 55, 8, 65).toFixed(1)),
      congestion_level: level,
      congestion_score: score,
      stopped_ratio:    parseFloat(clamp(score * 0.4, 0, 0.9).toFixed(3)),
      queue_length:     score > 0.6 ? randInt(2, 12) : 0,
      counts_by_class:  { car: randInt(10, 200), motorcycle: randInt(5, 50), bus: randInt(1, 8), truck: randInt(0, 4), three_wheeler: randInt(2, 15) },
      lane_id:          null,
    };
  }).reverse();
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (pathname === "/health") {
    return res.end(JSON.stringify({ status: "ok", kafka: "ok", postgres: "ok" }));
  }

  if (pathname === "/cameras") {
    return res.end(JSON.stringify(
      CAMERAS.map((c) => ({
        camera_id:    c.camera_id,
        road_segment: c.road_segment,
        latitude:     c.lat,
        longitude:    c.lng,
        active:       true,
        last_seen:    new Date().toISOString(),
      }))
    ));
  }

  if (pathname === "/congestion/current") {
    return res.end(JSON.stringify(buildAllMetrics()));
  }

  if (pathname === "/metrics/current") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) {
      res.writeHead(400);
      return res.end(JSON.stringify({ detail: "camera_id is required" }));
    }
    const cam = CAMERAS.find((c) => c.camera_id === cameraId) || CAMERAS[0];
    return res.end(JSON.stringify(buildMetric(cam)));
  }

  if (pathname === "/metrics/history") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) {
      res.writeHead(400);
      return res.end(JSON.stringify({ detail: "camera_id is required" }));
    }
    const fromParam = url.searchParams.get("from");
    const toParam   = url.searchParams.get("to");
    let history = HISTORY_CACHE[cameraId] || HISTORY_CACHE[CAMERAS[0].camera_id];
    if (fromParam || toParam) {
      const fromMs = fromParam ? new Date(fromParam).getTime() : 0;
      const toMs   = toParam   ? new Date(toParam).getTime()   : Infinity;
      history = history.filter((m) => {
        const t = new Date(m.window_end).getTime();
        return t >= fromMs && t <= toMs;
      });
    }
    return res.end(JSON.stringify(history));
  }

  // GET /api/public/traffic/current
  // Returns camelCase metrics wrapped in { items } for the B3 public-app frontend.
  if (pathname === "/api/public/traffic/current") {
    const raw = buildAllMetrics();
    const items = raw.map((m) => ({
      cameraId: m.camera_id,
      vehicleCount: m.vehicle_count,
      averageSpeedKmh: m.avg_speed_kmh,
      congestionScore: parseFloat((m.congestion_score * 100).toFixed(1)),
      congestionLevel: m.congestion_level,
      windowEnd: m.window_end,
    }));
    return res.end(JSON.stringify({ items }));
  }

  // GET /api/public/map/heatmap
  // Returns heatmap points with real Colombo lat/lng wrapped in { items }.
  if (pathname === "/api/public/map/heatmap") {
    const raw = buildAllMetrics();
    const items = raw.map((m) => {
      const cam = CAMERAS.find((c) => c.camera_id === m.camera_id) || CAMERAS[0];
      return {
        camera_id: m.camera_id,
        latitude: cam.lat,
        longitude: cam.lng,
        weight: parseFloat(m.congestion_score.toFixed(4)),
        vehicleCount: m.vehicle_count,
        congestionScore: parseFloat((m.congestion_score * 100).toFixed(1)),
      };
    });
    return res.end(JSON.stringify({ items }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ detail: "Not found" }));
});

// ─── WebSocket server ─────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws/metrics" });

wss.on("connection", (ws, req) => {
  const url    = new URL(req.url, `http://localhost:${PORT}`);
  const filter = url.searchParams.get("camera_id") || null;
  console.log(`  [WS] client connected${filter ? ` (filter: ${filter})` : " (all cameras)"}`);

  // Send the current snapshot immediately on connect
  const snapshot = filter
    ? buildAllMetrics().filter((m) => m.camera_id === filter)
    : buildAllMetrics();
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(snapshot));

  ws.on("close", () => console.log("  [WS] client disconnected"));
});

// Stream every 5 s
setInterval(() => {
  const metrics  = buildAllMetrics();
  const payload  = JSON.stringify(metrics);
  let clients = 0;
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) { ws.send(payload); clients++; }
  });
  if (clients > 0) {
    const levels = metrics.map((m) => `${m.camera_id.slice(-2)}:${m.congestion_level[0]}`).join(" ");
    console.log(`  [stream] → ${clients} client(s)  ${levels}`);
  }
}, STREAM_INTERVAL_MS);

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  const timeIST = new Date(Date.now() + 5.5 * 3600000)
    .toISOString().slice(11, 16);
  const mul = timeMultiplier();
  const mode =
    mul >= 1.5 ? "🔴 RUSH HOUR" :
    mul <= 0.4 ? "🌙 NIGHT QUIET" :
    "🟡 NORMAL";

  console.log(`
╔══════════════════════════════════════════════════════╗
║   🚦 ITS Demo B2 Mock Server — Sri Lanka Colombo    ║
╠══════════════════════════════════════════════════════╣
║  Listening  : http://localhost:${PORT}                ║
║  Cameras    : ${CAMERAS.length} (real Colombo locations)           ║
║  Stream     : WebSocket every ${STREAM_INTERVAL_MS / 1000}s                     ║
║  IST time   : ${timeIST}                              ║
║  Traffic    : ${mode.padEnd(30)}     ║
╚══════════════════════════════════════════════════════╝

  REST endpoints
  ─────────────────────────────────────────────────────
  GET  /health
  GET  /cameras
  GET  /congestion/current
  GET  /metrics/current?camera_id=cam_01
  GET  /metrics/history?camera_id=cam_01&from=<ISO>&to=<ISO>
  GET  /api/public/traffic/current   (B3 frontend)
  GET  /api/public/map/heatmap       (B3 frontend)

  WebSocket
  ─────────────────────────────────────────────────────
  ws://localhost:${PORT}/ws/metrics
  ws://localhost:${PORT}/ws/metrics?camera_id=cam_01

  Cameras in service
  ─────────────────────────────────────────────────────
${CAMERAS.map((c) => `  ${c.camera_id}  ${c.road_segment}`).join("\n")}

  Streaming...
`);
});
