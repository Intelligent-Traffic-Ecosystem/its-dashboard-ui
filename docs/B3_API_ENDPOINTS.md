# B3 Backend — API Endpoints Reference (v1.0.0)

This document lists the HTTP and Socket.IO endpoints provided by the B3 backend (in-memory v1 implementation). Use this as the canonical reference when integrating frontend clients or external services.

Base URL: `http://<b3-host>:<port>` (default `http://localhost:5000`)

Authentication
- Admin endpoints: require `X-Admin-Token: <token>` header or `Authorization: Bearer <token>` where `<token>` is `ADMIN_TOKEN` env var.
- Public read endpoints: no auth required by default (CORS controlled by `ALLOWED_ORIGINS`).

Contents
- Health
- Alerts
- Analytics
- Traffic
- Public
- Admin
- Dashboard
- Map
- WebSocket / Socket.IO events
- Error codes & examples
- Environment variables

---

**Health**

GET /health
- Returns overall service health and upstream (B2) status.
- Response 200:
```json
{ "status": "ok", "b2Status": "ok", "uptime": 3600 }
```

---

**Alerts**

GET /api/alerts/active
- Returns active (unacknowledged) alerts.
- Response: array of alert objects:
```json
{ "id":"alert-CAM-001-123","cameraId":"CAM-001","severity":"high","message":"High congestion","vehicleCount":85,"congestionScore":92,"timestamp":"2026-05-07T17:30:00Z" }
```

GET /api/alerts/history?cameraId={cameraId}&severity={severity}&from={from}&to={to}&limit={limit}&offset={offset}
- Returns paginated alert history. All query params optional; `from`/`to` are ISO 8601 timestamps.
- Response:
```json
{ "items": [ /* alerts */ ], "pagination": { "total":245, "limit":100, "offset":0, "hasMore":true } }
```

GET /api/alerts/export?camera_id={cameraId}&severity={severity}&from={from}&to={to}&limit={limit}
- Exports filtered alert history as CSV. Returns `text/csv` with `Content-Disposition: attachment; filename="alerts_<date>.csv"`.

POST /api/alerts/{alertId}/acknowledge
- Mark an alert as acknowledged. Request body can include `acknowledgedBy` metadata (optional).
- Response: acknowledgement object `{ alertId, acknowledgedBy, acknowledgedAt, status }`.

---

**Analytics**

GET /api/analytics/summary?cameraId={cameraId}&from={from}&to={to}
- Summary analytics for a camera and time range.
- Response includes `totalWindows`, `totalVehicles`, `averageCongestionScore`, `averageSpeedKmh`, `peakWindow`, `series`.

GET /api/analytics/trends/{cameraId}?from={from}&to={to}
- Returns trend analysis for the specified camera (trend, percentageChange, speedTrend, peakHour, series).

GET /api/analytics/metrics?from={from}&to={to}
- Aggregated metrics across cameras for the time range. Returns `peak_hour_distribution`, `top_segments`, `incident_pie`, and optional per-camera summaries.

GET /api/analytics/compare?aFrom={aFrom}&aTo={aTo}&bFrom={bFrom}&bTo={bTo}
- Compare two ranges side-by-side. Returns `range_a`, `range_b` analytics blocks and a `diff` summary.

GET /api/analytics/report/pdf?from={from}&to={to}
- Generates a PDF report (uses `pdfkit`) and returns `application/pdf` with `Content-Disposition` for download. Report contains summary tables and top segments.

---

**Traffic**

GET /api/traffic/metrics/current
- Returns latest metrics for all cameras or a provided `cameraId` query param.
- Metric object: `{ cameraId, timestamp, vehicleCount, averageSpeedKmh, congestionScore, laneMetrics: [...] }`.

GET /api/traffic/metrics/history?cameraId={cameraId}&from={from}&to={to}
- Returns historical metric windows for the camera/time range. Window size is implementation-defined (e.g., 5 minutes or 15 minutes).

---

**Public (no authentication)**

These endpoints are read-only and intended for public/user dashboards that do not have an operator session.

GET /api/public/traffic/current
- Returns current normalized traffic metrics.
- Response:
```json
{ "items": [ /* traffic metric objects */ ], "lastUpdated": "2026-05-07T10:05:00.000Z" }
```

GET /api/public/locations
- Returns live public map pins derived from current traffic metrics.
- Response:
```json
{ "items": [ { "id":"CAM-cam_01", "type":"incident", "severity":"warning", "lat":6.0248, "lng":80.2172, "title":"Traffic camera cam_01", "description":"MEDIUM congestion, 32.0 km/h average speed.", "status":"active", "timestamp":"2026-05-07T10:05:00.000Z" } ], "lastUpdated":"2026-05-07T10:05:00.000Z" }
```

GET /api/public/map/heatmap
- Returns public heatmap points: `{ lat, lng, weight }`.

GET /api/public/map/incidents
- Returns public active incident markers: `{ alertId, cameraId, lat, lng, severity, message, timestamp }`.

GET /api/public/map/live
- Returns one bundled response for public maps:
```json
{ "traffic": [], "locations": [], "heatmap": [], "incidents": [], "lastUpdated": "2026-05-07T10:05:00.000Z" }
```

---

**Admin (requires admin token)**

GET /api/admin/thresholds
- Read current thresholds for congestion levels (`low`, `moderate`, `high`).

PUT /api/admin/thresholds
- Update thresholds. Body example:
```json
{ "low": 25, "moderate": 50, "high": 75 }
```

Zones (CRUD)
GET /api/admin/zones
POST /api/admin/zones
PUT /api/admin/zones/{zoneId}
DELETE /api/admin/zones/{zoneId}
- Zone payload includes `id` (generated), `name`, `polygon` (array of lat/lng). Polygons are auto-closed when needed.

Camera registry (CRUD)
GET /api/admin/cameras
POST /api/admin/cameras
PUT /api/admin/cameras/{cameraId}
DELETE /api/admin/cameras/{cameraId}
- Camera object includes `cameraId`, `name`, `lat`, `lng`, `road_segment`, `metadata`.

Audit log: admin actions are recorded to an in-memory audit log. GET `/api/admin/audit?limit={n}` available for review.

---

**Dashboard**

GET /api/dashboard/summary
- Returns KPIs for dashboard home: `total_incidents_24h`, `avg_speed_kmh`, `overall_congestion_score`, `active_alerts_count`, `lastUpdated`.

GET /api/dashboard/events?limit={limit}
- Returns recent vehicle or system events used in the dashboard timeline.

---

**Map**

GET /api/map/heatmap
- Returns an array of heatmap points: `{ lat, lng, weight }` where weight is normalized to `[0,1]`.

GET /api/map/incidents
- Returns active incidents as markers: `{ alertId, cameraId, lat, lng, severity, message, timestamp }`.

---

**WebSocket / Socket.IO Events**

The B3 backend exposes a Socket.IO server that emits traffic and alert events.

Emitted events:
- `traffic:metrics` — payload: array of metric objects (broadcast to all clients).
- `traffic:congestion` — broadcast of congestion summary across cameras.
- `alert:new` — a newly-created alert object.

Client messages:
- `traffic:subscribe` { cameraId } — subscribe to a camera-specific room.
- `traffic:unsubscribe` { cameraId } — leave the camera room.

Subscribe example (client):
```javascript
socket.emit('traffic:subscribe', { cameraId: 'CAM-001' })
socket.on('traffic:metrics', (metrics) => { /* update UI */ })
socket.on('alert:new', (alert) => { /* show notification */ })
```

---

**Error Handling & Status Codes**

- 200: OK (successful GET/POST that returns content)
- 201: Created (resource created)
- 204: No Content (successful delete)
- 400: Bad Request (missing/invalid parameters)
- 401: Unauthorized (missing/invalid admin token)
- 403: Forbidden (admin token provided but insufficient privileges)
- 404: Not Found (resource not present)
- 500: Internal Server Error (unexpected failure)

Error response format:
```json
{ "error": "invalid_parameters", "message": "`from` must be ISO-8601 timestamp" }
```

---

Environment & Configuration

- `PORT` — server port (default 5000)
- `B2_API_BASE_URL` — B2 service base URL used to fetch historic metrics (default `http://localhost:18000`)
- `B2_WS_URL` — B2 WebSocket metrics URL (default `ws://localhost:18000/ws/metrics`)
- `ADMIN_TOKEN` — admin token for admin endpoints
- `ALLOWED_ORIGINS` — CORS allowed origins (comma-separated)

---

Versioning & Notes

- This document describes the v1 in-memory B3 backend. Persistent storage and authentication improvements (OAuth2/JWT) are planned for v2.
- When adding new endpoints, increment the docs and add an entry to `README_v1.0.0.md` changelog section.

---

Examples

1) Fetch active alerts (curl):
```bash
curl -sS http://localhost:5000/api/alerts/active
```

2) Export CSV of alerts for a camera between two timestamps:
```bash
curl -G "http://localhost:5000/api/alerts/export" \
  --data-urlencode "camera_id=CAM-001" \
  --data-urlencode "from=2026-05-01T00:00:00Z" \
  --data-urlencode "to=2026-05-07T23:59:59Z" \
  -o alerts_CAM-001_2026-05-07.csv
```

3) Generate analytics PDF:
```bash
curl -G "http://localhost:5000/api/analytics/report/pdf" \
  --data-urlencode "from=2026-05-01T00:00:00Z" \
  --data-urlencode "to=2026-05-07T23:59:59Z" \
  -o analytics_report_2026-05-01_to_2026-05-07.pdf
```

4) Acknowledge an alert (POST):
```bash
curl -X POST "http://localhost:5000/api/alerts/alert-CAM-001-123/acknowledge" \
  -H "Content-Type: application/json" \
  -d '{"acknowledgedBy":"alice"}'
```

5) Export alerts CSV for a camera (with date range):
```bash
curl -G "http://localhost:5000/api/alerts/export" \
  --data-urlencode "camera_id=CAM-001" \
  --data-urlencode "from=2026-05-01T00:00:00Z" \
  --data-urlencode "to=2026-05-07T23:59:59Z" \
  -o alerts_CAM-001_2026-05-07.csv
```

6) Get analytics trends for camera (JSON):
```bash
curl -sS "http://localhost:5000/api/analytics/trends/CAM-001?from=2026-05-01T00:00:00Z&to=2026-05-07T23:59:59Z"
```

7) Update congestion thresholds (admin):
```bash
curl -X PUT "http://localhost:5000/api/admin/thresholds" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: ${ADMIN_TOKEN}" \
  -d '{"low":25,"moderate":50,"high":75}'
```

8) Create a camera in registry (admin):
```bash
curl -X POST "http://localhost:5000/api/admin/cameras" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: ${ADMIN_TOKEN}" \
  -d '{"cameraId":"CAM-009","name":"Corner 9","lat":6.9012,"lng":79.8611,"road_segment":"A1"}'
```

9) Fetch heatmap points for the map layer:
```bash
curl -sS http://localhost:5000/api/map/heatmap
```

10) Socket.IO subscribe example (Node.js client):
```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000');
socket.emit('traffic:subscribe', { cameraId: 'CAM-001' });
socket.on('traffic:metrics', (metrics) => console.log('metrics', metrics));
socket.on('alert:new', (alert) => console.log('new alert', alert));
```

---

If you want, I can:
- add an OpenAPI (Swagger) YAML for these endpoints,
- update the `b3-backend.ts` frontend client with typed methods for each endpoint, or
- link this file from `README_v1.0.0.md`.

---

Document created: 2026-05-07
