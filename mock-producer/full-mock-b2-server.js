/**
 * full-mock-b2-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete replica of the B2 FastAPI data service for local integration testing.
 *
 * Covers every HTTP + WebSocket endpoint that the B3 BFF calls:
 *
 *   REST
 *   ─────────────────────────────────────────────────────────────────────────
 *   GET  /health
 *   GET  /cameras
 *   GET  /congestion/current
 *   GET  /metrics/current?camera_id=X
 *   GET  /metrics/history?camera_id=X&from=ISO&to=ISO
 *   GET  /api/dashboard/summary
 *   GET  /api/dashboard/events?limit=N
 *   GET  /api/alerts/history?camera_id=X&severity=X&from=ISO&to=ISO&limit=N&offset=N
 *   POST /api/alerts/:id/acknowledge          (X-Admin-Token required)
 *   GET  /api/alerts/export                   (CSV stream)
 *   GET  /api/admin/thresholds                (X-Admin-Token)
 *   PUT  /api/admin/thresholds                (X-Admin-Token)
 *   GET  /api/admin/zones                     (X-Admin-Token)
 *   POST /api/admin/zones                     (X-Admin-Token)
 *   PUT  /api/admin/zones/:id                 (X-Admin-Token)
 *   DELETE /api/admin/zones/:id               (X-Admin-Token)
 *   GET  /api/admin/cameras                   (X-Admin-Token)
 *   POST /api/admin/cameras                   (X-Admin-Token)
 *   PUT  /api/admin/cameras/:id               (X-Admin-Token)
 *   DELETE /api/admin/cameras/:id             (X-Admin-Token)
 *   GET  /api/analytics/metrics?start=ISO&end=ISO
 *   GET  /api/analytics/report/pdf?start=ISO&end=ISO  (binary stream)
 *   GET  /api/predict/congestion?camera_id=X&horizon_minutes=N&lookback_minutes=N
 *
 *   WebSocket
 *   ─────────────────────────────────────────────────────────────────────────
 *   ws://localhost:18000/ws/metrics           → TrafficMetric[] batch every 5 s
 *   ws://localhost:18000/ws/metrics/lanes     → per-lane TrafficMetric[] batch
 *   ws://localhost:18000/ws/events            → { event, ts, data } envelopes
 *
 * Usage:
 *   node mock-producer/full-mock-b2-server.js
 *   # or: npm run full-mock-b2  (from mock-producer/)
 *
 * Admin token (matches B3 env default):
 *   Set B2_ADMIN_TOKEN env var, or use the default "admin-secret-dev"
 */

"use strict";

const http    = require("http");
const { WebSocketServer } = require("ws");

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT          = 18000;
const STREAM_MS     = 5_000;
const ADMIN_TOKEN   = process.env.B2_ADMIN_TOKEN || "admin-secret-dev";

// ─── Sri Lanka — Colombo District camera registry ────────────────────────────
const CAMERA_REGISTRY = [
  { camera_id: "cam_01", road_segment: "Galle Road – Bambalapitiya",        lat: 6.8900, lng: 79.8553 },
  { camera_id: "cam_02", road_segment: "Kandy Road – Kelaniya Junction",    lat: 6.9549, lng: 79.9213 },
  { camera_id: "cam_03", road_segment: "Colombo Fort – Main Street",        lat: 6.9344, lng: 79.8428 },
  { camera_id: "cam_04", road_segment: "Nugegoda Junction – High Level Rd", lat: 6.8726, lng: 79.8989 },
  { camera_id: "cam_05", road_segment: "Rajagiriya Flyover",                lat: 6.9083, lng: 79.9022 },
  { camera_id: "cam_06", road_segment: "Maharagama Junction – A4",          lat: 6.8472, lng: 79.9261 },
  { camera_id: "cam_07", road_segment: "Borella – D.S. Senanayake Mawatha", lat: 6.9108, lng: 79.8699 },
  { camera_id: "cam_08", road_segment: "Wellawatte – Galle Road South",     lat: 6.8729, lng: 79.8588 },
];

// ─── In-memory mutable stores (admin CRUD targets) ────────────────────────────
let adminCameras = CAMERA_REGISTRY.map((c, i) => ({
  camera_id:    c.camera_id,
  road_segment: c.road_segment,
  latitude:     c.lat,
  longitude:    c.lng,
  active:       true,
  last_seen:    new Date().toISOString(),
  created_at:   new Date(Date.now() - i * 86_400_000).toISOString(),
}));

let thresholds = [
  { id: 1, camera_id: null,     level: "HIGH",   threshold: 0.75, action: "alert",    created_at: new Date().toISOString() },
  { id: 2, camera_id: null,     level: "SEVERE", threshold: 0.90, action: "emergency", created_at: new Date().toISOString() },
  { id: 3, camera_id: "cam_01", level: "HIGH",   threshold: 0.70, action: "alert",    created_at: new Date().toISOString() },
];

let zones = [
  { id: 1, name: "Colombo Central",  camera_ids: ["cam_01", "cam_03", "cam_07"], created_at: new Date().toISOString() },
  { id: 2, name: "Southern Corridor", camera_ids: ["cam_01", "cam_08"],           created_at: new Date().toISOString() },
  { id: 3, name: "Eastern Suburbs",   camera_ids: ["cam_04", "cam_05", "cam_06"], created_at: new Date().toISOString() },
];

// Pre-seeded alert history (numeric IDs → B2 AlertRecord rows)
let alertHistory = (() => {
  const TYPES     = ["congestion", "speed_violation", "incident"];
  const SEVERITIES = ["LOW", "MODERATE", "HIGH", "SEVERE"];
  const now = Date.now();
  return Array.from({ length: 40 }, (_, i) => {
    const cam  = CAMERA_REGISTRY[i % CAMERA_REGISTRY.length];
    const sev  = SEVERITIES[i % SEVERITIES.length];
    const score = sev === "SEVERE" ? rand(0.85, 0.98) : sev === "HIGH" ? rand(0.65, 0.85) : sev === "MODERATE" ? rand(0.40, 0.65) : rand(0.05, 0.40);
    const ts   = new Date(now - i * 1_800_000); // every 30 min going back
    return {
      id:               1000 + i,
      alert_type:       TYPES[i % TYPES.length],
      severity:         sev,
      camera_id:        cam.camera_id,
      road_segment:     cam.road_segment,
      title:            `${sev} Congestion — ${cam.road_segment}`,
      message:          `Congestion score ${score.toFixed(2)} detected on ${cam.road_segment}.`,
      congestion_level: sev,
      congestion_score: parseFloat(score.toFixed(4)),
      acknowledged:     i % 5 === 0,
      triggered_at:     ts.toISOString(),
      resolved_at:      i % 3 === 0 ? new Date(ts.getTime() + 15 * 60_000).toISOString() : null,
      acknowledged_by:  i % 5 === 0 ? "officer_01" : null,
      acknowledged_at:  i % 5 === 0 ? new Date(ts.getTime() + 5 * 60_000).toISOString() : null,
    };
  });
})();

let nextAlertId   = 2000;
let nextZoneId    = zones.length + 1;
let nextThreshId  = thresholds.length + 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function clamp(v, lo, hi)  { return Math.max(lo, Math.min(hi, v)); }

function scoreToLevel(s) {
  if (s < 0.25) return "LOW";
  if (s < 0.50) return "MODERATE";
  if (s < 0.75) return "HIGH";
  return "SEVERE";
}

/** IST rush-hour time multiplier (UTC + 5:30). */
function timeMultiplier() {
  const nowIST = new Date(Date.now() + 5.5 * 3_600_000);
  const h = nowIST.getUTCHours() + nowIST.getUTCMinutes() / 60;
  if (h >= 7   && h <= 9.5)  return 1.60;
  if (h >= 16.5 && h <= 19.5) return 1.50;
  if (h >= 22  || h < 5)     return 0.35;
  if (h >= 12  && h <= 13)   return 0.80;
  return 1.0;
}

// ─── Live congestion state (smooth Brownian drift) ────────────────────────────
const liveState = {};
CAMERA_REGISTRY.forEach((c) => {
  liveState[c.camera_id] = {
    score:    Math.random() * 0.5 + 0.1,
    velocity: (Math.random() - 0.5) * 0.02,
  };
});

function tickCamera(cameraId) {
  const s   = liveState[cameraId];
  const mul = timeMultiplier();
  s.velocity += (Math.random() - 0.5) * 0.008;
  s.velocity  = clamp(s.velocity, -0.04, 0.04);
  s.score     = clamp(s.score + s.velocity * mul, 0.05, 0.98);
  return s.score;
}

/** Build one B2 snake_case TrafficMetric for a camera. */
function buildMetric(cam, peekOnly = false) {
  const score   = peekOnly ? liveState[cam.camera_id].score : tickCamera(cam.camera_id);
  const level   = scoreToLevel(score);
  const mul     = timeMultiplier();
  const base    = Math.round(score * 280 * mul + 20);
  const speed   = parseFloat(clamp(65 - score * 55 + rand(-5, 5), 8, 65).toFixed(1));
  const wEnd    = new Date();
  const wStart  = new Date(wEnd - 5_000);
  return {
    camera_id:        cam.camera_id,
    window_start:     wStart.toISOString(),
    window_end:       wEnd.toISOString(),
    vehicle_count:    base + randInt(-5, 5),
    avg_speed_kmh:    speed,
    congestion_level: level,
    congestion_score: parseFloat(score.toFixed(4)),
    stopped_ratio:    parseFloat(clamp(score * 0.4, 0, 0.9).toFixed(3)),
    queue_length:     score > 0.6 ? randInt(2, 12) : 0,
    counts_by_class:  {
      car:           randInt(Math.floor(base * 0.50), Math.floor(base * 0.70)),
      motorcycle:    randInt(Math.floor(base * 0.15), Math.floor(base * 0.25)),
      bus:           randInt(1, 8),
      truck:         randInt(0, 4),
      three_wheeler: randInt(2, 15),
    },
    lane_id: null,
  };
}

function buildAllMetrics() {
  return CAMERA_REGISTRY.map((c) => buildMetric(c));
}

// ─── Pre-built 24-hour history cache ─────────────────────────────────────────
const HISTORY_CACHE = {};
function buildHistoryCache() {
  const now    = Date.now();
  const POINTS = 288; // 24 h × 12 pts/h @ 5-min windows
  const STEP   = 5 * 60_000;

  CAMERA_REGISTRY.forEach((cam) => {
    const base = Math.random() * 0.3 + 0.15;
    let score  = base;

    HISTORY_CACHE[cam.camera_id] = Array.from({ length: POINTS }, (_, i) => {
      const wEnd   = new Date(now - (POINTS - 1 - i) * STEP);
      const wStart = new Date(wEnd - STEP);
      const istH   = new Date(wEnd.getTime() + 5.5 * 3_600_000).getUTCHours();
      const istM   = new Date(wEnd.getTime() + 5.5 * 3_600_000).getUTCMinutes();
      const h      = istH + istM / 60;
      const mul    = (h >= 7 && h <= 9.5) ? 1.65 : (h >= 16.5 && h <= 19.5) ? 1.55 : (h >= 22 || h < 5) ? 0.30 : (h >= 12 && h <= 13) ? 0.75 : 1.0;

      score += (Math.random() - 0.5) * 0.06;
      score  = clamp(score * mul, 0.05, 0.97);
      score  = score * 0.9 + base * 0.1;

      const level = scoreToLevel(score);
      const bc    = Math.round(score * 280 * mul + 20);
      return {
        camera_id:        cam.camera_id,
        window_start:     wStart.toISOString(),
        window_end:       wEnd.toISOString(),
        vehicle_count:    Math.max(1, bc + randInt(-8, 8)),
        avg_speed_kmh:    parseFloat(clamp(65 - score * 55 + rand(-3, 3), 8, 65).toFixed(1)),
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
setInterval(buildHistoryCache, 60 * 60_000); // refresh hourly

// ─── Body reader ──────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end",  () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

// ─── Admin token guard ────────────────────────────────────────────────────────
function requireAdmin(req, res) {
  const token = req.headers["x-admin-token"];
  if (!ADMIN_TOKEN || token === ADMIN_TOKEN) return true; // skip if token not configured
  res.writeHead(403);
  res.end(JSON.stringify({ detail: "Invalid or missing X-Admin-Token" }));
  return false;
}

// ─── Response helpers ─────────────────────────────────────────────────────────
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url      = new URL(req.url, `http://localhost:${PORT}`);
  const path     = url.pathname;
  const method   = req.method;

  // ── GET /health ─────────────────────────────────────────────────────────────
  if (path === "/health" && method === "GET") {
    return json(res, 200, { status: "ok", kafka: "ok", postgres: "ok" });
  }

  // ── GET /cameras ─────────────────────────────────────────────────────────────
  if (path === "/cameras" && method === "GET") {
    return json(res, 200, CAMERA_REGISTRY.map((c) => ({
      camera_id:    c.camera_id,
      road_segment: c.road_segment,
      latitude:     c.lat,
      longitude:    c.lng,
      active:       true,
      last_seen:    new Date().toISOString(),
    })));
  }

  // ── GET /congestion/current ───────────────────────────────────────────────────
  if (path === "/congestion/current" && method === "GET") {
    return json(res, 200, buildAllMetrics());
  }

  // ── GET /metrics/current?camera_id=X ─────────────────────────────────────────
  if (path === "/metrics/current" && method === "GET") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) return json(res, 400, { detail: "camera_id is required" });
    const cam = CAMERA_REGISTRY.find((c) => c.camera_id === cameraId);
    if (!cam)      return json(res, 404, { detail: `Camera ${cameraId} not found` });
    return json(res, 200, buildMetric(cam));
  }

  // ── GET /metrics/history?camera_id=X&from=ISO&to=ISO ─────────────────────────
  if (path === "/metrics/history" && method === "GET") {
    const cameraId = url.searchParams.get("camera_id");
    if (!cameraId) return json(res, 400, { detail: "camera_id is required" });

    const fromMs = url.searchParams.get("from") ? new Date(url.searchParams.get("from")).getTime() : 0;
    const toMs   = url.searchParams.get("to")   ? new Date(url.searchParams.get("to")).getTime()   : Infinity;

    let history = HISTORY_CACHE[cameraId] || HISTORY_CACHE[CAMERA_REGISTRY[0].camera_id];
    history = history.filter((m) => {
      const t = new Date(m.window_end).getTime();
      return t >= fromMs && t <= toMs;
    });
    return json(res, 200, history);
  }

  // ── GET /api/dashboard/summary ────────────────────────────────────────────────
  if (path === "/api/dashboard/summary" && method === "GET") {
    const all     = buildAllMetrics();
    const avg     = all.reduce((s, m) => s + m.congestion_score, 0) / all.length;
    const speeds  = all.reduce((s, m) => s + m.avg_speed_kmh, 0) / all.length;
    const breakdown = all.reduce((acc, m) => {
      acc[m.congestion_level] = (acc[m.congestion_level] || 0) + 1;
      return acc;
    }, {});
    const worst   = all.reduce((a, b) => a.congestion_score > b.congestion_score ? a : b);
    return json(res, 200, {
      average_congestion_score_5m: parseFloat(avg.toFixed(4)),
      total_incidents_24h:         randInt(4, 18),
      total_vehicles_last_window:  all.reduce((s, m) => s + m.vehicle_count, 0),
      total_cameras_active:        all.length,
      average_speed_kmh:           parseFloat(speeds.toFixed(1)),
      active_alerts:               all.filter((m) => m.congestion_score >= 0.55).length,
      congestion_breakdown:        breakdown,
      worst_camera:                worst.camera_id,
      generated_at:                new Date().toISOString(),
    });
  }

  // ── GET /api/dashboard/events?limit=N ────────────────────────────────────────
  if (path === "/api/dashboard/events" && method === "GET") {
    const limit    = Math.min(Number(url.searchParams.get("limit") || 10), 100);
    const classes  = ["car", "motorcycle", "bus", "truck", "three_wheeler"];
    const events   = Array.from({ length: limit }, (_, i) => {
      const cam = CAMERA_REGISTRY[i % CAMERA_REGISTRY.length];
      return {
        camera_id:   cam.camera_id,
        vehicle_id:  `v_${Date.now() - i * 500}`,
        class:       classes[i % classes.length],
        speed_kmh:   parseFloat(rand(15, 75).toFixed(1)),
        lane_id:     randInt(1, 3),
        confidence:  parseFloat(rand(0.80, 0.99).toFixed(2)),
        timestamp:   new Date(Date.now() - i * 2_000).toISOString(),
      };
    });
    return json(res, 200, events);
  }

  // ── GET /api/alerts/history ───────────────────────────────────────────────────
  if (path === "/api/alerts/history" && method === "GET") {
    const q         = url.searchParams;
    const camFilter = q.get("camera_id")  || null;
    const sevFilter = q.get("severity")   || null;
    const fromMs    = q.get("from") ? new Date(q.get("from")).getTime() : 0;
    const toMs      = q.get("to")   ? new Date(q.get("to")).getTime()   : Infinity;

    const filtered = alertHistory.filter((a) => {
      if (camFilter && a.camera_id !== camFilter) return false;
      if (sevFilter && a.severity.toUpperCase() !== sevFilter.toUpperCase()) return false;
      const t = new Date(a.triggered_at).getTime();
      return t >= fromMs && t <= toMs;
    });

    return json(res, 200, filtered);
  }

  // ── POST /api/alerts/:id/acknowledge ─────────────────────────────────────────
  {
    const m = path.match(/^\/api\/alerts\/(\d+)\/acknowledge$/);
    if (m && method === "POST") {
      if (!requireAdmin(req, res)) return;
      const body    = await readBody(req);
      const alertId = Number(m[1]);
      const record  = alertHistory.find((a) => a.id === alertId);
      if (!record) return json(res, 404, { detail: `Alert ${alertId} not found` });

      record.acknowledged    = true;
      record.acknowledged_by = body.admin_id || "unknown";
      record.acknowledged_at = new Date().toISOString();

      return json(res, 200, {
        alert_id:        record.id,
        admin_id:        record.acknowledged_by,
        acknowledged_at: record.acknowledged_at,
        status:          "acknowledged",
      });
    }
  }

  // ── GET /api/alerts/export (CSV stream) ───────────────────────────────────────
  if (path === "/api/alerts/export" && method === "GET") {
    const q         = url.searchParams;
    const camFilter = q.get("camera_id") || null;
    const sevFilter = q.get("severity")  || null;
    const fromMs    = q.get("from") ? new Date(q.get("from")).getTime() : 0;
    const toMs      = q.get("to")   ? new Date(q.get("to")).getTime()   : Infinity;
    const lim       = Math.min(Number(q.get("limit") || 500000), 500000);

    const rows = alertHistory
      .filter((a) => {
        if (camFilter && a.camera_id !== camFilter) return false;
        if (sevFilter && a.severity.toUpperCase() !== sevFilter.toUpperCase()) return false;
        const t = new Date(a.triggered_at).getTime();
        return t >= fromMs && t <= toMs;
      })
      .slice(0, lim);

    const header  = "id,alert_type,severity,camera_id,road_segment,title,congestion_score,acknowledged,triggered_at\n";
    const csvRows = rows.map((a) =>
      [a.id, a.alert_type, a.severity, a.camera_id,
       `"${a.road_segment}"`, `"${a.title}"`,
       a.congestion_score, a.acknowledged, a.triggered_at].join(",")
    ).join("\n");

    res.writeHead(200, {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="alerts-export-${Date.now()}.csv"`,
    });
    res.end(header + csvRows);
    return;
  }

  // ── Admin: GET /api/admin/thresholds ─────────────────────────────────────────
  if (path === "/api/admin/thresholds" && method === "GET") {
    if (!requireAdmin(req, res)) return;
    return json(res, 200, thresholds);
  }

  // ── Admin: PUT /api/admin/thresholds ─────────────────────────────────────────
  if (path === "/api/admin/thresholds" && method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    // Accept either a single object or an array
    const updates = Array.isArray(body) ? body : [body];
    updates.forEach((u) => {
      const idx = thresholds.findIndex((t) => t.id === u.id);
      if (idx !== -1) Object.assign(thresholds[idx], u);
      else { thresholds.push({ ...u, id: nextThreshId++, created_at: new Date().toISOString() }); }
    });
    return json(res, 200, thresholds);
  }

  // ── Admin: GET /api/admin/zones ───────────────────────────────────────────────
  if (path === "/api/admin/zones" && method === "GET") {
    if (!requireAdmin(req, res)) return;
    return json(res, 200, zones);
  }

  // ── Admin: POST /api/admin/zones ──────────────────────────────────────────────
  if (path === "/api/admin/zones" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body = await readBody(req);
    const zone = { ...body, id: nextZoneId++, created_at: new Date().toISOString() };
    zones.push(zone);
    return json(res, 201, zone);
  }

  // ── Admin: PUT /api/admin/zones/:id ──────────────────────────────────────────
  {
    const m = path.match(/^\/api\/admin\/zones\/(\d+)$/);
    if (m && method === "PUT") {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const idx  = zones.findIndex((z) => z.id === Number(m[1]));
      if (idx === -1) return json(res, 404, { detail: "Zone not found" });
      zones[idx] = { ...zones[idx], ...body, id: zones[idx].id };
      return json(res, 200, zones[idx]);
    }
  }

  // ── Admin: DELETE /api/admin/zones/:id ───────────────────────────────────────
  {
    const m = path.match(/^\/api\/admin\/zones\/(\d+)$/);
    if (m && method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      const idx = zones.findIndex((z) => z.id === Number(m[1]));
      if (idx === -1) return json(res, 404, { detail: "Zone not found" });
      zones.splice(idx, 1);
      res.writeHead(204); res.end(); return;
    }
  }

  // ── Admin: GET /api/admin/cameras ────────────────────────────────────────────
  if (path === "/api/admin/cameras" && method === "GET") {
    if (!requireAdmin(req, res)) return;
    return json(res, 200, adminCameras);
  }

  // ── Admin: POST /api/admin/cameras ────────────────────────────────────────────
  if (path === "/api/admin/cameras" && method === "POST") {
    if (!requireAdmin(req, res)) return;
    const body   = await readBody(req);
    const camera = { ...body, active: true, last_seen: null, created_at: new Date().toISOString() };
    adminCameras.push(camera);
    return json(res, 201, camera);
  }

  // ── Admin: PUT /api/admin/cameras/:id ────────────────────────────────────────
  {
    const m = path.match(/^\/api\/admin\/cameras\/([^/]+)$/);
    if (m && method === "PUT") {
      if (!requireAdmin(req, res)) return;
      const body = await readBody(req);
      const camId = decodeURIComponent(m[1]);
      const idx   = adminCameras.findIndex((c) => c.camera_id === camId);
      if (idx === -1) return json(res, 404, { detail: `Camera ${camId} not found` });
      adminCameras[idx] = { ...adminCameras[idx], ...body, camera_id: camId };
      return json(res, 200, adminCameras[idx]);
    }
  }

  // ── Admin: DELETE /api/admin/cameras/:id ─────────────────────────────────────
  {
    const m = path.match(/^\/api\/admin\/cameras\/([^/]+)$/);
    if (m && method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      const camId = decodeURIComponent(m[1]);
      const idx   = adminCameras.findIndex((c) => c.camera_id === camId);
      if (idx === -1) return json(res, 404, { detail: `Camera ${camId} not found` });
      adminCameras.splice(idx, 1);
      res.writeHead(204); res.end(); return;
    }
  }

  // ── GET /api/analytics/metrics?start=ISO&end=ISO ─────────────────────────────
  if (path === "/api/analytics/metrics" && method === "GET") {
    const startParam = url.searchParams.get("start");
    const endParam   = url.searchParams.get("end");
    if (!startParam || !endParam) return json(res, 400, { detail: "start and end are required" });

    const fromMs = new Date(startParam).getTime();
    const toMs   = new Date(endParam).getTime();

    // Build per-camera aggregates from the history cache
    const topSegments = CAMERA_REGISTRY.map((cam) => {
      const history = (HISTORY_CACHE[cam.camera_id] || []).filter((m) => {
        const t = new Date(m.window_end).getTime();
        return t >= fromMs && t <= toMs;
      });
      const avgCong   = history.length ? history.reduce((s, m) => s + m.congestion_score, 0) / history.length : 0;
      const incidents = history.filter((m) => m.congestion_score >= 0.55).length;
      return { camera_id: cam.camera_id, average_congestion: parseFloat(avgCong.toFixed(4)), incident_count: incidents };
    }).sort((a, b) => b.average_congestion - a.average_congestion);

    // Build peak-hour distribution (hour 0–23)
    const hourBuckets = {};
    CAMERA_REGISTRY.forEach((cam) => {
      (HISTORY_CACHE[cam.camera_id] || []).forEach((m) => {
        const t = new Date(m.window_end).getTime();
        if (t < fromMs || t > toMs) return;
        const h = new Date(m.window_end).getUTCHours();
        if (!hourBuckets[h]) hourBuckets[h] = { count: 0, totalVehicles: 0, totalCong: 0 };
        hourBuckets[h].count++;
        hourBuckets[h].totalVehicles += m.vehicle_count;
        hourBuckets[h].totalCong     += m.congestion_score;
      });
    });
    const peakHourTrends = Object.entries(hourBuckets).map(([h, b]) => ({
      hour:               Number(h),
      vehicle_count:      Math.round(b.totalVehicles / b.count),
      average_congestion: parseFloat((b.totalCong / b.count).toFixed(4)),
    })).sort((a, b) => a.hour - b.hour);

    // Overall averages
    let totalCong = 0, n = 0, highCount = 0, critCount = 0;
    topSegments.forEach((seg) => {
      totalCong += seg.average_congestion; n++;
      highCount += seg.incident_count;
      critCount += Math.round(seg.incident_count * 0.2);
    });
    const avgCong = n ? totalCong / n : 0;

    return json(res, 200, {
      start:               startParam,
      end:                 endParam,
      average_congestion:  parseFloat(avgCong.toFixed(4)),
      incidents:           { high: highCount, critical: critCount },
      peak_hour_trends:    peakHourTrends,
      top_segments:        topSegments,
    });
  }

  // ── GET /api/analytics/report/pdf ────────────────────────────────────────────
  if (path === "/api/analytics/report/pdf" && method === "GET") {
    // Emit a minimal valid PDF so B3's Readable.fromWeb() stream proxy works
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Root 1 0 R/Size 4>>
startxref
190
%%EOF`;
    const from = url.searchParams.get("start") || url.searchParams.get("from") || "unknown";
    res.writeHead(200, {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="analytics-report-${from.slice(0, 10)}.pdf"`,
    });
    res.end(pdfContent);
    return;
  }

  // ── GET /api/predict/congestion ───────────────────────────────────────────────
  if (path === "/api/predict/congestion" && method === "GET") {
    const cameraId      = url.searchParams.get("camera_id");
    if (!cameraId) return json(res, 400, { detail: "camera_id is required" });
    const horizon       = Math.min(Number(url.searchParams.get("horizon_minutes")  || 15), 60);
    const lookback      = Math.min(Number(url.searchParams.get("lookback_minutes") || 30), 120);
    const currentScore  = liveState[cameraId]?.score ?? rand(0.2, 0.7);
    const steps         = Math.max(1, Math.round(horizon / 5));
    const predictions   = Array.from({ length: steps }, (_, i) => {
      const ts    = new Date(Date.now() + (i + 1) * 5 * 60_000);
      const drift = (Math.random() - 0.5) * 0.08 * (i + 1);
      const score = parseFloat(clamp(currentScore + drift, 0.05, 0.98).toFixed(4));
      return { timestamp: ts.toISOString(), congestion_score: score, congestion_level: scoreToLevel(score) };
    });
    return json(res, 200, {
      camera_id:       cameraId,
      horizon_minutes: horizon,
      lookback_minutes: lookback,
      predictions,
    });
  }

  // ── 404 ───────────────────────────────────────────────────────────────────────
  json(res, 404, { detail: `No mock route: ${method} ${path}` });
});

// ─── WebSocket servers (noServer — manual upgrade routing) ────────────────────
const wssMetrics = new WebSocketServer({ noServer: true });
const wssLanes   = new WebSocketServer({ noServer: true });
const wssEvents  = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const pathname = new URL(req.url, `http://localhost:${PORT}`).pathname;
  if (pathname === "/ws/metrics") {
    wssMetrics.handleUpgrade(req, socket, head, (ws) => wssMetrics.emit("connection", ws, req));
  } else if (pathname === "/ws/metrics/lanes") {
    wssLanes.handleUpgrade(req, socket, head, (ws) => wssLanes.emit("connection", ws, req));
  } else if (pathname === "/ws/events") {
    wssEvents.handleUpgrade(req, socket, head, (ws) => wssEvents.emit("connection", ws, req));
  } else {
    socket.destroy();
  }
});

// /ws/metrics — bulk camera metric batch
wssMetrics.on("connection", (ws) => {
  console.log("  [ws/metrics]       client connected");
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(buildAllMetrics()));
  ws.on("close", () => console.log("  [ws/metrics]       client disconnected"));
});

// /ws/metrics/lanes — same metrics but with lane_id = 1 or 2
wssLanes.on("connection", (ws) => {
  console.log("  [ws/metrics/lanes] client connected");
  const laneMetrics = CAMERA_REGISTRY.flatMap((cam) => [1, 2].map((lane) => {
    const m = buildMetric(cam, true);
    return { ...m, lane_id: lane, vehicle_count: Math.round(m.vehicle_count / 2) };
  }));
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(laneMetrics));
  ws.on("close", () => console.log("  [ws/metrics/lanes] client disconnected"));
});

// /ws/events — event envelope bus
wssEvents.on("connection", (ws) => {
  console.log("  [ws/events]        client connected");
  ws.on("close", () => console.log("  [ws/events]        client disconnected"));
});

// ─── Streaming intervals ──────────────────────────────────────────────────────

// Metrics stream every 5 s
setInterval(() => {
  const payload = JSON.stringify(buildAllMetrics());
  let n = 0;
  wssMetrics.clients.forEach((ws) => { if (ws.readyState === ws.OPEN) { ws.send(payload); n++; } });
  if (n > 0) {
    const top = buildAllMetrics().slice(0, 3).map((m) => `${m.camera_id.slice(-2)}:${m.congestion_level[0]}`).join(" ");
    console.log(`  [stream metrics]   → ${n} client(s)  ${top}`);
  }
}, STREAM_MS);

// Lane metrics stream every 5 s
setInterval(() => {
  if (!wssLanes.clients.size) return;
  const laneMetrics = CAMERA_REGISTRY.flatMap((cam) => [1, 2].map((lane) => {
    const m = buildMetric(cam, true);
    return { ...m, lane_id: lane, vehicle_count: Math.round(m.vehicle_count / 2) };
  }));
  const payload = JSON.stringify(laneMetrics);
  let n = 0;
  wssLanes.clients.forEach((ws) => { if (ws.readyState === ws.OPEN) { ws.send(payload); n++; } });
  if (n > 0) console.log(`  [stream lanes]     → ${n} client(s)`);
}, STREAM_MS);

// Events bus: rotate through event types every 7 s
const EVENT_TYPES = ["heatmap_update", "new_alert", "admin_broadcast"];
let evtIdx = 0;
setInterval(() => {
  if (!wssEvents.clients.size) return;
  const type = EVENT_TYPES[evtIdx % EVENT_TYPES.length];
  evtIdx++;

  let data;
  if (type === "heatmap_update") {
    data = CAMERA_REGISTRY.map((cam) => ({
      camera_id:       cam.camera_id,
      latitude:        cam.lat,
      longitude:       cam.lng,
      weight:          parseFloat((liveState[cam.camera_id]?.score || 0.3).toFixed(4)),
      vehicle_count:   randInt(10, 250),
      congestion_score: parseFloat((liveState[cam.camera_id]?.score || 0.3).toFixed(4)),
    }));
  } else if (type === "new_alert") {
    const cam   = CAMERA_REGISTRY[randInt(0, CAMERA_REGISTRY.length - 1)];
    const score = parseFloat(rand(0.60, 0.95).toFixed(4));
    const sev   = scoreToLevel(score);
    data = {
      id:               nextAlertId++,
      alert_type:       "congestion",
      severity:         sev,
      camera_id:        cam.camera_id,
      road_segment:     cam.road_segment,
      title:            `${sev} Congestion — ${cam.road_segment}`,
      message:          `Score ${score} detected.`,
      congestion_level: sev,
      congestion_score: score,
      acknowledged:     false,
      triggered_at:     new Date().toISOString(),
    };
    alertHistory.unshift({ ...data });
  } else {
    data = { message: "Config updated.", admin_id: "system", timestamp: new Date().toISOString() };
  }

  const envelope = JSON.stringify({ event: type, ts: new Date().toISOString(), data });
  let n = 0;
  wssEvents.clients.forEach((ws) => { if (ws.readyState === ws.OPEN) { ws.send(envelope); n++; } });
  if (n > 0) console.log(`  [stream events]    → ${n} client(s)  event=${type}`);
}, 7_000);

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  const nowIST   = new Date(Date.now() + 5.5 * 3_600_000);
  const timeIST  = nowIST.toISOString().slice(11, 16);
  const mul      = timeMultiplier();
  const mode     = mul >= 1.5 ? "🔴 RUSH HOUR" : mul <= 0.4 ? "🌙 NIGHT QUIET" : "🟡 NORMAL";

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║   🚦 ITS Full Mock B2 Server — Sri Lanka Colombo               ║
╠══════════════════════════════════════════════════════════════════╣
║  Listening  : http://localhost:${PORT}                            ║
║  Cameras    : ${CAMERA_REGISTRY.length} (real Colombo locations)                    ║
║  Admin token: ${ADMIN_TOKEN}                          ║
║  IST time   : ${timeIST}                                          ║
║  Traffic    : ${mode.padEnd(40)}  ║
╚══════════════════════════════════════════════════════════════════╝

  REST endpoints
  ─────────────────────────────────────────────────────────────────
  GET  /health
  GET  /cameras
  GET  /congestion/current
  GET  /metrics/current?camera_id=cam_01
  GET  /metrics/history?camera_id=cam_01&from=<ISO>&to=<ISO>
  GET  /api/dashboard/summary
  GET  /api/dashboard/events?limit=10
  GET  /api/alerts/history?camera_id=cam_01&severity=HIGH&limit=20
  POST /api/alerts/:id/acknowledge            (X-Admin-Token: ${ADMIN_TOKEN})
  GET  /api/alerts/export                     (CSV download)
  GET  /api/admin/thresholds                  (X-Admin-Token)
  PUT  /api/admin/thresholds                  (X-Admin-Token)
  GET  /api/admin/zones                       (X-Admin-Token)
  POST /api/admin/zones                       (X-Admin-Token)
  PUT  /api/admin/zones/:id                   (X-Admin-Token)
  DELETE /api/admin/zones/:id                 (X-Admin-Token)
  GET  /api/admin/cameras                     (X-Admin-Token)
  POST /api/admin/cameras                     (X-Admin-Token)
  PUT  /api/admin/cameras/:id                 (X-Admin-Token)
  DELETE /api/admin/cameras/:id               (X-Admin-Token)
  GET  /api/analytics/metrics?start=<ISO>&end=<ISO>
  GET  /api/analytics/report/pdf?start=<ISO>&end=<ISO>
  GET  /api/predict/congestion?camera_id=cam_01&horizon_minutes=15

  WebSocket
  ─────────────────────────────────────────────────────────────────
  ws://localhost:${PORT}/ws/metrics         → TrafficMetric[] every 5 s
  ws://localhost:${PORT}/ws/metrics/lanes   → per-lane metrics every 5 s
  ws://localhost:${PORT}/ws/events          → event envelopes every 7 s

  Cameras
  ─────────────────────────────────────────────────────────────────
${CAMERA_REGISTRY.map((c) => `  ${c.camera_id}  ${c.road_segment}`).join("\n")}

  Streaming...
`);
});
