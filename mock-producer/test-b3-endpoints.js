/**
 * test-b3-endpoints.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Self-contained B3 endpoint checker.
 *
 *  1. Spins up an embedded mock B2 server on :18000
 *  2. Hits every B3 backend endpoint on :5000
 *  3. Reports ✅ / ❌ for each endpoint
 *  4. Shuts down the mock B2 server and exits
 *
 * Prerequisites (the ONLY thing you need running):
 *   npm run dev  (in backend/)  with DEV_BYPASS_AUTH=true
 *
 * Run:
 *   node mock-producer/test-b3-endpoints.js
 */

"use strict";
const http = require("http");
const { WebSocket, WebSocketServer } = require("ws");

// ─── Config ───────────────────────────────────────────────────────────────────
const B3_BASE  = "http://localhost:5000";
const WS_BASE  = "ws://localhost:5000";
const B2_PORT  = 18000;
const CAMERA_ID = "cam_01";
const FROM = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const TO   = new Date().toISOString();

let passed = 0;
let failed = 0;

// ─── Colour helpers ───────────────────────────────────────────────────────────
const c = (code, s) => `\x1b[${code}m${s}\x1b[0m`;
const green  = (s) => c(32, s);
const red    = (s) => c(31, s);
const yellow = (s) => c(33, s);
const cyan   = (s) => c(36, s);
const bold   = (s) => c(1,  s);

function log(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ${green("✅")} ${label}  ${yellow(detail)}`); }
  else     { failed++; console.log(`  ${red("❌")} ${label}  ${red(detail)}`); }
}

// ─── Embedded Mock B2 Server ──────────────────────────────────────────────────
const CAMERAS = ["cam_01", "cam_02", "cam_03", "cam_04"];

function rand(min, max)    { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

function buildMetric(cameraId) {
  const score = parseFloat(rand(0.1, 0.95).toFixed(3));
  const level = score < 0.3 ? "LOW" : score < 0.55 ? "MODERATE" : score < 0.8 ? "HIGH" : "CRITICAL";
  const wEnd   = new Date();
  const wStart = new Date(wEnd - 5000);
  return {
    camera_id:        cameraId,
    window_start:     wStart.toISOString(),
    window_end:       wEnd.toISOString(),
    vehicle_count:    randInt(5, 120),
    avg_speed_kmh:    parseFloat(rand(10, 90).toFixed(1)),
    congestion_level: level,
    congestion_score: score,
    lane_id:          null,
  };
}

function buildHistory(cameraId, count = 60) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const wEnd = new Date(now - i * 5000);
    const score = parseFloat(rand(0.1, 0.95).toFixed(3));
    return {
      camera_id:        cameraId,
      window_start:     new Date(wEnd - 5000).toISOString(),
      window_end:       wEnd.toISOString(),
      vehicle_count:    randInt(5, 120),
      avg_speed_kmh:    parseFloat(rand(10, 90).toFixed(1)),
      congestion_level: score < 0.3 ? "LOW" : score < 0.55 ? "MODERATE" : score < 0.8 ? "HIGH" : "CRITICAL",
      congestion_score: score,
      lane_id:          null,
    };
  }).reverse();
}

function startMockB2Server() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${B2_PORT}`);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");

      if (url.pathname === "/health") {
        return res.end(JSON.stringify({ status: "ok", kafka: "ok", postgres: "ok" }));
      }
      if (url.pathname === "/cameras") {
        return res.end(JSON.stringify(
          CAMERAS.map((id) => ({
            camera_id: id,
            road_segment: `Segment-${id.split("_")[1]}`,
            latitude: parseFloat(rand(6.85, 6.95).toFixed(6)),
            longitude: parseFloat(rand(79.85, 79.95).toFixed(6)),
            active: true,
          }))
        ));
      }
      if (url.pathname === "/congestion/current") {
        return res.end(JSON.stringify(CAMERAS.map(buildMetric)));
      }
      if (url.pathname === "/metrics/current") {
        const cameraId = url.searchParams.get("camera_id");
        if (!cameraId) { res.writeHead(400); return res.end(JSON.stringify({ detail: "camera_id required" })); }
        return res.end(JSON.stringify(buildMetric(cameraId)));
      }
      if (url.pathname === "/metrics/history") {
        const cameraId = url.searchParams.get("camera_id");
        if (!cameraId) { res.writeHead(400); return res.end(JSON.stringify({ detail: "camera_id required" })); }
        return res.end(JSON.stringify(buildHistory(cameraId)));
      }
      res.writeHead(404);
      res.end(JSON.stringify({ detail: "Not found" }));
    });

    // Attach WebSocket server for /ws/metrics
    const wss = new WebSocketServer({ server, path: "/ws/metrics" });
    const interval = setInterval(() => {
      const payload = JSON.stringify(CAMERAS.map(buildMetric));
      wss.clients.forEach((ws) => {
        if (ws.readyState === ws.OPEN) ws.send(payload);
      });
    }, 3000);

    server.listen(B2_PORT, () => {
      console.log(cyan(`\n  [mock-b2] Running on :${B2_PORT}  (HTTP + WebSocket /ws/metrics)\n`));
      resolve({ server, interval });
    });
  });
}

// ─── HTTP helper (sends dev-bypass cookie) ────────────────────────────────────
function get(path, query = {}) {
  return new Promise((resolve) => {
    const params = new URLSearchParams(query).toString();
    const fullPath = path + (params ? "?" + params : "");
    const req = http.request(
      { hostname: "localhost", port: 5000, path: fullPath, method: "GET",
        headers: { Cookie: "access_token=dev-bypass-token", Accept: "application/json" } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 0, body: "timeout" }); });
    req.end();
  });
}

// ─── Individual test groups ───────────────────────────────────────────────────
async function testSystem() {
  console.log(bold("\n── System ────────────────────────────────────────────────"));
  let r = await get("/");
  log("GET  /  (welcome)", r.status === 200, `HTTP ${r.status}`);
  r = await get("/health");
  log("GET  /health", r.status === 200, `HTTP ${r.status}`);
}

async function testPublic() {
  console.log(bold("\n── Public (no auth) ──────────────────────────────────────"));
  const cases = [
    ["/api/public/traffic/current"],
    ["/api/public/locations"],
    ["/api/public/map/heatmap"],
    ["/api/public/map/incidents"],
    ["/api/public/map/live"],
  ];
  for (const [path, query] of cases) {
    const r = await get(path, query);
    log(`GET  ${path}`, r.status === 200, `HTTP ${r.status}`);
  }
}

async function testLocations() {
  console.log(bold("\n── Locations ─────────────────────────────────────────────"));
  const r = await get("/api/locations");
  log("GET  /api/locations", r.status === 200, `HTTP ${r.status}`);
}

async function testTraffic() {
  console.log(bold("\n── Traffic ───────────────────────────────────────────────"));
  let r;

  r = await get("/api/traffic/cameras");
  log("GET  /api/traffic/cameras", r.status === 200, `HTTP ${r.status}`);

  r = await get("/api/traffic/congestion/current");
  log("GET  /api/traffic/congestion/current", r.status === 200, `HTTP ${r.status}`);

  r = await get("/api/traffic/metrics/current", { camera_id: CAMERA_ID });
  log(`GET  /api/traffic/metrics/current?camera_id=${CAMERA_ID}`, r.status === 200, `HTTP ${r.status}`);

  r = await get("/api/traffic/metrics/current"); // no camera_id → 400
  log("GET  /api/traffic/metrics/current (no camera_id → 400)", r.status === 400, `HTTP ${r.status}`);

  r = await get("/api/traffic/metrics/history", { camera_id: CAMERA_ID, from: FROM, to: TO });
  log(`GET  /api/traffic/metrics/history?camera_id=${CAMERA_ID}`, r.status === 200, `HTTP ${r.status}`);

  r = await get("/api/traffic/metrics/history", { camera_id: CAMERA_ID }); // no from/to → 400
  log("GET  /api/traffic/metrics/history (no from/to → 400)", r.status === 400, `HTTP ${r.status}`);
}

async function testDashboard() {
  console.log(bold("\n── Dashboard ─────────────────────────────────────────────"));
  let r;
  r = await get("/api/dashboard/summary");
  log("GET  /api/dashboard/summary", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/dashboard/events");
  log("GET  /api/dashboard/events", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/dashboard/events", { limit: 5 });
  log("GET  /api/dashboard/events?limit=5", r.status === 200, `HTTP ${r.status}`);
}

async function testAlerts() {
  console.log(bold("\n── Alerts ────────────────────────────────────────────────"));
  let r;
  r = await get("/api/alerts/active");
  log("GET  /api/alerts/active", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/alerts/history");
  log("GET  /api/alerts/history", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/alerts/history", { severity: "CRITICAL", limit: 10 });
  log("GET  /api/alerts/history?severity=CRITICAL&limit=10", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/alerts/export");
  log("GET  /api/alerts/export (CSV)", r.status === 200, `HTTP ${r.status}`);
}

async function testAnalytics() {
  console.log(bold("\n── Analytics ─────────────────────────────────────────────"));
  let r;
  r = await get("/api/analytics/summary", { camera_id: CAMERA_ID, from: FROM, to: TO });
  log(`GET  /api/analytics/summary?camera_id=${CAMERA_ID}`, r.status === 200, `HTTP ${r.status}`);
  r = await get(`/api/analytics/trends/${CAMERA_ID}`, { from: FROM, to: TO });
  log(`GET  /api/analytics/trends/${CAMERA_ID}`, r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/analytics/metrics", { from: FROM, to: TO });
  log("GET  /api/analytics/metrics", r.status === 200, `HTTP ${r.status}`);
  const half = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  r = await get("/api/analytics/compare", { aFrom: FROM, aTo: half, bFrom: half, bTo: TO });
  log("GET  /api/analytics/compare", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/analytics/metrics"); // no from/to → 400
  log("GET  /api/analytics/metrics (no from/to → 400)", r.status === 400, `HTTP ${r.status}`);
}

async function testMap() {
  console.log(bold("\n── Map ───────────────────────────────────────────────────"));
  let r;
  r = await get("/api/map/heatmap");
  log("GET  /api/map/heatmap", r.status === 200, `HTTP ${r.status}`);
  r = await get("/api/map/incidents");
  log("GET  /api/map/incidents", r.status === 200, `HTTP ${r.status}`);
}

async function testAuth() {
  console.log(bold("\n── Auth ──────────────────────────────────────────────────"));
  // With dev cookie
  const withCookie = await get("/api/auth/me");
  log("GET  /api/auth/me (dev cookie → 200)", withCookie.status === 200, `HTTP ${withCookie.status}`);

  // Without cookie — expect 401 (only when DEV_BYPASS_AUTH=false; in dev mode this is 200 — we just document it)
  const noCookie = await new Promise((resolve) => {
    const req = http.request(
      { hostname: "localhost", port: 5000, path: "/api/auth/me", method: "GET",
        headers: { Accept: "application/json" } },
      (res) => { res.resume(); res.on("end", () => resolve({ status: res.statusCode })); }
    );
    req.on("error", () => resolve({ status: 0 }));
    req.end();
  });
  // In DEV_BYPASS_AUTH=true mode this returns 200 — that is expected, not a bug
  const devBypass = noCookie.status === 200;
  console.log(`  ${cyan("ℹ")}  GET  /api/auth/me (no cookie)  HTTP ${noCookie.status}  ${devBypass ? yellow("(DEV_BYPASS_AUTH=true — auth skipped, expected)") : green("→ 401 correct")}`);
}

async function testDocs() {
  console.log(bold("\n── API Docs ──────────────────────────────────────────────"));
  const r = await get("/docs/");
  log("GET  /docs/ (Swagger UI)", [200, 301, 302].includes(r.status), `HTTP ${r.status}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(cyan("\n════════════════════════════════════════════════════════")));
  console.log(bold(cyan("   B3 Backend Endpoint Checker (self-contained)")));
  console.log(bold(cyan("   B3 target : " + B3_BASE)));
  console.log(bold(cyan("   Mock B2   : http://localhost:" + B2_PORT)));
  console.log(bold(cyan("════════════════════════════════════════════════════════")));

  // Start embedded mock B2 server
  const { server: b2Server, interval: b2Interval } = await startMockB2Server();

  // Give the B3 backend 800 ms to reconnect its B2 WS client to our mock server
  await new Promise((r) => setTimeout(r, 800));

  // Run all tests
  await testSystem();
  await testPublic();
  await testLocations();
  await testTraffic();
  await testDashboard();
  await testAlerts();
  await testAnalytics();
  await testMap();
  await testAuth();
  await testDocs();

  // Shut down mock B2 server
  clearInterval(b2Interval);
  b2Server.close();

  // Print summary
  const total = passed + failed;
  console.log(bold(`\n════════════════════════════════════════════════════════`));
  console.log(bold(`   Results: ${failed === 0 ? green(`${passed}/${total} passed`) : red(`${passed}/${total} passed`) }  ${failed > 0 ? red(`(${failed} failed)`) : ""}`));
  console.log(bold(`════════════════════════════════════════════════════════\n`));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(red("Unexpected error:"), err);
  process.exit(1);
});
