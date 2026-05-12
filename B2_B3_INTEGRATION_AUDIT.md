# B2 ↔ B3 BFF Integration Audit

Full analysis of every B2 data service endpoint, how it is (or is not) wired into the B3 backend-for-frontend, all field-level transformations, and every identified mismatch or missing integration.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [B2 Data Service — All Endpoints](#2-b2-data-service--all-endpoints)
3. [B3 BFF — Client / Adapter / Mapper Layer](#3-b3-bff--client--adapter--mapper-layer)
4. [B3 Services & Routes](#4-b3-services--routes)
5. [Full Wiring Map — B2 → B3](#5-full-wiring-map--b2--b3)
6. [Field-Level Transformation Reference](#6-field-level-transformation-reference)
7. [Issues & Mismatches](#7-issues--mismatches)
8. [Risk Summary](#8-risk-summary)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  Frontend Apps (Next.js)                                   │
│  admin-dashboard :3001 │ traffic-dashboard :3000           │
│  public-app :3002      │ login :3003                       │
└──────────────────────────────┬─────────────────────────────┘
                               │ HTTP + cookies
                               ▼
┌────────────────────────────────────────────────────────────┐
│  B3 BFF (Express.js) — port 5000                           │
│                                                            │
│  Routes → Services → Adapters → Mappers → B2 HTTP Client  │
│  socket.js bridge ← B2WebSocketClient × 3 (all active)    │
│                                                            │
│  In-memory state: alerts, admin cameras/zones/thresholds   │
└──────────────────────────────┬─────────────────────────────┘
                               │ HTTP  (B2_API_BASE_URL)
                               │ WS1   (B2_WS_URL)        /ws/metrics
                               │ WS2   (B2_WS_LANES_URL)  /ws/metrics/lanes
                               │ WS3   (B2_WS_EVENTS_URL) /ws/events
                               ▼
┌────────────────────────────────────────────────────────────┐
│  B2 Data Service (FastAPI/Python) — port 18000             │
│                                                            │
│  REST + WebSocket API                                      │
│  PostgreSQL-backed (TrafficMetric, AlertRecord, etc.)      │
│  Kafka consumer (from B1 vision pipeline)                  │
└────────────────────────────────────────────────────────────┘
```

**Key facts:**
- B3 communicates with B2 over HTTP (`b2HttpClient.js`) and three persistent WebSocket connections (`b2WebSocketClient.js` × 3)
- All three B2 WebSocket feeds are active and bridged to frontend clients via Socket.io
- All REST endpoints (traffic, dashboard, analytics, alerts, admin, prediction) now delegate to B2's PostgreSQL-backed APIs
- Map heatmap/incidents are built in B3 from B2 data (camera coords from `CameraRegistry`, metrics from congestion endpoint) — B2's `/api/map/*` endpoints are not called directly
- The only unwired B2 endpoint is `POST /api/admin/notifications/broadcast`

> **Last updated:** 2026-05-12 — All 11 issues resolved. One remaining gap: admin broadcast not exposed.

---

## 2. B2 Data Service — All Endpoints

### 2.1 Cameras

#### `GET /cameras`
- **Auth:** None
- **Query params:** None
- **Response:**
  ```json
  [
    {
      "camera_id": "cam_01",
      "last_seen": "2026-05-12T10:05:00Z"
    }
  ]
  ```
- **Source:** PostgreSQL `TrafficMetric` — groups by `camera_id`, returns max `window_end` per camera

---

### 2.2 Metrics

#### `GET /metrics/current`
- **Auth:** None
- **Query params:**

  | Param | Type | Required | Notes |
  |-------|------|----------|-------|
  | `camera_id` | string | Yes | |

- **Response:** Single `TrafficMetricOutput`
  ```json
  {
    "camera_id": "cam_01",
    "window_start": "2026-05-12T10:00:00Z",
    "window_end": "2026-05-12T10:05:00Z",
    "lane_id": null,
    "vehicle_count": 45,
    "counts_by_class": { "car": 30, "truck": 15 },
    "avg_speed_kmh": 35.5,
    "stopped_ratio": 0.2,
    "queue_length": 8,
    "congestion_level": "HIGH",
    "congestion_score": 0.75
  }
  ```
- **Congestion level enum:** `LOW` | `MODERATE` | `HIGH` | `SEVERE`
- **Source:** PostgreSQL `TrafficMetric`

#### `GET /metrics/history`
- **Auth:** None
- **Query params:**

  | Param | Type | Required |
  |-------|------|----------|
  | `camera_id` | string | Yes |
  | `from` | ISO 8601 datetime | Yes |
  | `to` | ISO 8601 datetime | Yes |

- **Response:** `list[TrafficMetricOutput]` ordered by `window_start` ascending
- **Source:** PostgreSQL `TrafficMetric`

---

### 2.3 Congestion

#### `GET /congestion/current`
- **Auth:** None
- **Query params:** None
- **Response:** `list[TrafficMetricOutput]` — one latest metric per camera (all cameras)
- **Source:** PostgreSQL subquery — max `window_start` per `camera_id`

---

### 2.4 Dashboard

#### `GET /api/dashboard/summary`
- **Auth:** None (B2 side — auth enforced by B3)
- **Response:**
  ```json
  {
    "generated_at": "2026-05-12T10:05:00Z",
    "active_alerts": 3,
    "total_incidents_24h": 12,
    "average_speed_kmh_5m": 38.2,
    "average_congestion_score_5m": 0.6,
    "total_cameras_active": 8,
    "total_vehicles_last_window": 200,
    "average_speed_kmh": 40.0,
    "congestion_breakdown": {
      "LOW": 3,
      "MODERATE": 2,
      "HIGH": 2,
      "SEVERE": 1
    },
    "worst_camera": {
      "camera_id": "cam_07",
      "congestion_level": "SEVERE",
      "congestion_score": 0.95
    }
  }
  ```
- **Source:** PostgreSQL `TrafficMetric` + `AlertRecord`

#### `GET /api/dashboard/events`
- **Auth:** None (B2 side)
- **Query params:**

  | Param | Type | Default | Range |
  |-------|------|---------|-------|
  | `limit` | int | 10 | 1–100 |

- **Response:**
  ```json
  [
    {
      "camera_id": "cam_01",
      "timestamp": "2026-05-12T10:05:00Z",
      "vehicle_id": "VH-001",
      "class": "car",
      "lane_id": 1,
      "speed_kmh": 42.0,
      "confidence": 0.93
    }
  ]
  ```
- **Source:** PostgreSQL `TrafficEvent` table (raw B1 events)

---

### 2.5 Analytics

#### `GET /api/analytics/metrics`
- **Auth:** None (B2 side)
- **Query params:**

  | Param | Type | Default |
  |-------|------|---------|
  | `start` | ISO 8601 | 24 hours ago |
  | `end` | ISO 8601 | now |

- **Response:**
  ```json
  {
    "start": "...",
    "end": "...",
    "average_congestion": 0.62,
    "peak_hour_trends": [
      { "hour": 8, "average_congestion": 0.8, "average_speed_kmh": 28.0, "vehicle_count": 320 }
    ],
    "top_segments": [
      { "camera_id": "cam_03", "lane_id": null, "average_congestion": 0.85, "average_queue_length": 12, "incident_count": 5 }
    ],
    "incidents": {
      "total_incidents": 20,
      "high": 12,
      "critical": 8
    }
  }
  ```
- **Source:** PostgreSQL `TrafficMetric` + `CameraRegistry`

#### `GET /api/analytics/compare`
- **Auth:** None (B2 side)
- **Query params:**

  | Param | Type | Required |
  |-------|------|----------|
  | `start_a` | ISO 8601 | Yes |
  | `end_a` | ISO 8601 | Yes |
  | `start_b` | ISO 8601 | Yes |
  | `end_b` | ISO 8601 | Yes |

- **Response:**
  ```json
  {
    "range_a": {
      "start": "...", "end": "...",
      "average_congestion": 0.6, "vehicle_count": 1500,
      "average_speed_kmh": 42.0, "incident_count": 10, "peak_hour": 8
    },
    "range_b": { "..." : "..." },
    "congestion_delta": -0.05,
    "vehicle_count_delta": 200,
    "speed_delta": 3.5,
    "incident_delta": -2
  }
  ```
- **Source:** PostgreSQL `TrafficMetric`

#### `GET /api/analytics/report/pdf`
- **Auth:** None (B2 side)
- **Query params:** `start`, `end` (both optional, ISO 8601)
- **Response:** Binary PDF stream (`application/pdf`)
- **Source:** PostgreSQL — uses same data as `/api/analytics/metrics`

---

### 2.6 Alerts

#### `GET /api/alerts/history`
- **Auth:** None (B2 side)
- **Query params:**

  | Param | Type | Required |
  |-------|------|----------|
  | `camera_id` | string | No |
  | `severity` | string | No |
  | `road_segment` | string | No |
  | `from` | ISO 8601 | No |
  | `to` | ISO 8601 | No |
  | `type` | string | No |

- **Response:** `list[AlertOutput]`
  ```json
  [
    {
      "id": 42,
      "camera_id": "cam_03",
      "road_segment": "Main Street",
      "alert_type": "congestion_spike",
      "severity": "HIGH",
      "title": "High congestion detected",
      "message": "...",
      "congestion_level": "HIGH",
      "congestion_score": 0.87,
      "triggered_at": "2026-05-12T09:00:00Z",
      "resolved_at": null,
      "acknowledged": false,
      "acknowledged_by": null,
      "acknowledged_at": null
    }
  ]
  ```
- **Source:** PostgreSQL `AlertRecord` (persisted by B2's alert engine)

#### `POST /api/alerts/{id}/acknowledge`
- **Auth:** Admin token required (B2 side)
- **Path params:** `id: int`
- **Request body:**
  ```json
  { "admin_id": "user-sub-uuid" }
  ```
- **Response:**
  ```json
  {
    "alert_id": 42,
    "admin_id": "user-sub-uuid",
    "acknowledged_at": "2026-05-12T10:05:00Z",
    "status": "acknowledged"
  }
  ```
- **Source:** PostgreSQL `AlertRecord` (write)

#### `GET /api/alerts/export`
- **Auth:** None (B2 side)
- **Query params:** Same as `/api/alerts/history`
- **Response:** CSV stream (`text/csv`)

---

### 2.7 Admin

All admin endpoints require `X-Admin-Token` header on B2 side.

#### `GET /api/admin/thresholds`
- **Response:**
  ```json
  {
    "congestion_threshold_low": 0.3,
    "congestion_threshold_moderate": 0.55,
    "congestion_threshold_high": 0.8
  }
  ```
- **Source:** PostgreSQL `AdminThreshold` — creates defaults if not exist

#### `PUT /api/admin/thresholds`
- **Request body / Response:** Same schema as GET, validated: `low ≤ moderate ≤ high`

#### `GET /api/admin/zones`
- **Response:** `list[ZoneOut]`
  ```json
  [
    {
      "id": 1,
      "name": "City Centre",
      "description": "...",
      "coordinates": [{ "lat": 6.89, "lon": 79.85 }],
      "created_at": "...",
      "updated_at": "..."
    }
  ]
  ```

#### `POST /api/admin/zones`
- **Request body:** `{ "name": "...", "description": "...", "coordinates": [{ "lat": 0, "lon": 0 }] }`
- **Validation:** ≥ 3 unique coordinate points, coordinates normalised to closed polygon

#### `PUT /api/admin/zones/{zone_id}` / `DELETE /api/admin/zones/{zone_id}`
- Standard update/delete patterns, 204 on delete

#### `GET /api/admin/cameras`
- **Response:** `list[CameraRegistryOut]`
  ```json
  [
    {
      "id": 1,
      "camera_id": "cam_01",
      "name": "Main St Cam",
      "latitude": 6.89,
      "longitude": 79.85,
      "road_segment": "Main Street",
      "description": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
  ```

#### `POST /api/admin/cameras`
- **Request body:** `{ "camera_id", "name", "latitude"/"lat", "longitude"/"lng", "road_segment", "description" }`
- **Status:** 201 Created

#### `PUT /api/admin/cameras/{camera_id}` / `DELETE /api/admin/cameras/{camera_id}`
- Upsert on PUT, 204 on delete

#### `POST /api/admin/notifications/broadcast`
- **Request body:** `{ "severity": "WARNING|CRITICAL", "title": "...", "message": "..." }`
- **Response:** 202 Accepted
- **Effect:** Pushes to all WebSocket operator connections on B2

---

### 2.8 Map

#### `GET /api/map/heatmap`
- **Query params:**

  | Param | Type | Default | Range |
  |-------|------|---------|-------|
  | `minutes` | int | 5 | 1–60 |

- **Response:**
  ```json
  {
    "window_minutes": 5,
    "points": [
      {
        "camera_id": "cam_01",
        "latitude": 6.89,
        "longitude": 79.85,
        "road_segment": "Main Street",
        "weight": 0.75,
        "intensity": "HIGH",
        "avg_vehicle_count": 45,
        "last_window": "2026-05-12T10:05:00Z"
      }
    ]
  }
  ```
- **Source:** PostgreSQL `TrafficMetric` + `CameraRegistry` (real lat/lng from DB)

#### `GET /api/map/incidents`
- **Query params:** `severity` (optional: `LOW|MODERATE|HIGH|SEVERE`)
- **Response:**
  ```json
  [
    {
      "camera_id": "cam_03",
      "latitude": 6.95,
      "longitude": 79.92,
      "road_segment": "Kandy Road",
      "severity": "HIGH",
      "score": 0.87,
      "vehicle_count": 60,
      "queue_length": 14,
      "avg_speed_kmh": 18.0,
      "counts_by_class": { "car": 40, "bus": 20 },
      "window_end": "2026-05-12T10:05:00Z"
    }
  ]
  ```
- **Source:** PostgreSQL `TrafficMetric` + `CameraRegistry`

---

### 2.9 Health

#### `GET /health`
- **Response:**
  ```json
  {
    "status": "ok",
    "kafka": "ok",
    "postgres": "ok"
  }
  ```
- **Status values:** `ok` | `degraded` | `unreachable`

---

### 2.10 Prediction (ML)

#### `GET /api/predict/congestion`
- **Query params:**

  | Param | Type | Default | Range |
  |-------|------|---------|-------|
  | `camera_id` | string | — | required |
  | `horizon_minutes` | int | 10 | 1–30 |
  | `lookback_minutes` | int | 15 | 1–120 |

- **Response:** ST-GCN forecast payload (camera-specific congestion forecast)
- **Source:** PostgreSQL history → ST-GCN model inference

---

### 2.11 WebSocket Endpoints

#### `WS /ws/metrics`
- **Query params:** `camera_id` (optional), `role: viewer|operator`
- **Broadcast:** Every N seconds (configurable `ws_broadcast_interval`)
- **Message format:** `list[TrafficMetricOutput]`

#### `WS /ws/metrics/lanes`
- **Query params:** `camera_id` (optional), `role: viewer|operator`
- **Message format:** `list[TrafficMetricOutput]` (lane_id IS NOT NULL only)

#### `WS /ws/events` *(unified event bus)*
- **Query params:** `types` (comma-separated — defaults to all)
- **Message envelope:**
  ```json
  { "event": "traffic_metrics_update", "ts": "2026-05-12T10:05:00Z", "data": { ... } }
  ```
- **Event types:**

  | Event | Interval | Data |
  |-------|----------|------|
  | `traffic_metrics_update` | every 5s | camera-wide metrics |
  | `heatmap_update` | every 10s | 5-min rolling heatmap |
  | `new_alert` | instant | camera flipped to HIGH/SEVERE |
  | `admin_broadcast` | on-demand | admin notification payload |

---

## 3. B3 BFF — Client / Adapter / Mapper Layer

### 3.1 B2 HTTP Client
**File:** `backend/src/clients/b2HttpClient.js`

| Method | Purpose | Returns |
|--------|---------|---------|
| `get(path, query)` | Standard JSON GET with timeout | Parsed JSON |
| `post(path, body, extraHeaders)` | POST with JSON body + optional custom headers (e.g. `X-Admin-Token`) | Parsed JSON |
| `streamGet(path, query)` | GET that returns the raw `Response` — used for binary/stream endpoints (PDF, CSV) | Raw `Response` |

- Base URL: `process.env.B2_API_BASE_URL` (localhost auto-replaced with 127.0.0.1)
- Timeout: `B2_REQUEST_TIMEOUT_MS` (default 5 000 ms); `streamGet` clears the timeout before streaming so the body is not aborted

### 3.2 B2 WebSocket Client
**File:** `backend/src/clients/b2WebSocketClient.js`

```
b2WebSocketClient.subscribe(onMessage)
  → opens WS to the configured URL
  → parses JSON, calls onMessage on each message
  → auto-reconnects on close/error (B2_WS_RECONNECT_MS = 3000ms)
  → returns unsubscribe()
```

Three independent instances are created by `createB2TrafficDataAdapter()`, one per feed:

| Instance | Env var | Connects to | Used by |
|----------|---------|-------------|---------|
| `websocketClient` | `B2_WS_URL` | `ws://.../ws/metrics` | `subscribeToMetrics()` |
| `laneMetricsClient` | `B2_WS_LANES_URL` | `ws://.../ws/metrics/lanes` | `subscribeLaneMetrics()` ✅ Added |
| `eventsClient` | `B2_WS_EVENTS_URL` | `ws://.../ws/events` | `subscribeToEvents()` ✅ Added |

### 3.3 Data Adapter
**File:** `backend/src/adapters/b2TrafficDataAdapter.js`

| Method | Transport | B2 Endpoint | Status |
|--------|-----------|-------------|--------|
| `getHealth()` | HTTP GET | `GET /health` | ✅ |
| `listCameras()` | HTTP GET | `GET /cameras` | ✅ |
| `getCurrentMetric(cameraId)` | HTTP GET | `GET /metrics/current?camera_id=X` | ✅ |
| `getMetricHistory(cameraId, from, to)` | HTTP GET | `GET /metrics/history?camera_id=X&from=Y&to=Z` | ✅ |
| `getCurrentCongestion()` | HTTP GET | `GET /congestion/current` | ✅ |
| `getDashboardSummary()` | HTTP GET | `GET /api/dashboard/summary` | ✅ |
| `getDashboardEvents(limit)` | HTTP GET | `GET /api/dashboard/events?limit=N` | ✅ |
| `getAnalyticsMetrics(start, end)` | HTTP GET | `GET /api/analytics/metrics?start=&end=` | ✅ |
| `streamAnalyticsReportPdf(start, end)` | HTTP streamGet | `GET /api/analytics/report/pdf?start=&end=` | ✅ |
| `getAlertHistory(params)` | HTTP GET | `GET /api/alerts/history` (all filters) | ✅ |
| `acknowledgeAlert(alertId, userId)` | HTTP POST | `POST /api/alerts/{id}/acknowledge` + `X-Admin-Token` | ✅ |
| `streamAlertExport(params)` | HTTP streamGet | `GET /api/alerts/export` (all filters) | ✅ |
| `subscribeToMetrics(cb)` | WS | `WS /ws/metrics` | ✅ |
| `subscribeLaneMetrics(cb)` | WS | `WS /ws/metrics/lanes` | ✅ |
| `subscribeToEvents(cb)` | WS | `WS /ws/events` | ✅ |

### 3.4 Metric Mapper
**File:** `backend/src/mappers/b2MetricMapper.js`

See [Section 6 — Field-Level Transformation Reference](#6-field-level-transformation-reference) for the full field mapping table.

### 3.5 Alert Mapper
**File:** `backend/src/mappers/alertMapper.js`

Converts a `TrafficMetric` object (already mapped from B2) into a synthetic B3 alert:

| Metric Input | Alert Output | Logic |
|---|---|---|
| `metric.congestionScore` | `severity` | score ≥ 0.9 → `emergency` |
| `metric.congestionLevel == "HIGH"` | `severity = "critical"` | |
| `metric.congestionLevel == "MEDIUM"` | `severity = "warning"` | **⚠ B2 never sends MEDIUM — see Issue #1** |
| else | `severity = "informational"` | |
| `metric.cameraId` | `id = "ALERT-{cameraId}-{windowEnd}"` | Generated ID — not persisted |
| `metric.windowEnd` | `timestamp` | |

### 3.7 Socket.io Bridge
**File:** `backend/src/socket.js`

Consumes all three B2 WebSocket feeds and re-emits typed Socket.io events to connected frontend clients.

| B2 WS Feed | B2 Message Format | Socket.io Event Emitted | Payload to Frontend |
|------------|------------------|------------------------|---------------------|
| `/ws/metrics` | `TrafficMetricOutput[]` (snake_case) | `traffic:metrics` | `TrafficMetric[]` (camelCase, mapped) |
| `/ws/metrics` | same | `traffic:congestion` | same (backwards-compat alias) |
| `/ws/metrics/lanes` | `TrafficMetricOutput[]` (lane_id NOT NULL) | `traffic:lane_metrics` | `TrafficMetric[]` (camelCase, mapped) |
| `/ws/events` → `traffic_metrics_update` | `{ event, ts, data: metric[] }` | `traffic:metrics_update` | `{ ts, data: TrafficMetric[] }` (mapped) |
| `/ws/events` → `heatmap_update` | `{ event, ts, data: point[] }` | `map:heatmap` | `{ ts, data: HeatmapPoint[] }` (pass-through) |
| `/ws/events` → `new_alert` | `{ event, ts, data: alert }` | `alert:new` | normalised alert object with `_b2SeverityToB3()` |
| `/ws/events` → `admin_broadcast` | `{ event, ts, data: notification }` | `admin:broadcast` | `{ ts, data }` (pass-through) |

**Client-to-server room subscriptions (sent from browser):**

| Event | Payload | Effect |
|-------|---------|--------|
| `traffic:subscribe` | `{ cameraId }` | Joins `camera:{cameraId}` room — receives per-camera `traffic:metrics` |
| `traffic:unsubscribe` | `{ cameraId }` | Leaves room |
| `lanes:subscribe` | `{ cameraId? }` | Joins `lanes:{cameraId}` or `lanes:all` — receives `traffic:lane_metrics` |
| `lanes:unsubscribe` | `{ cameraId? }` | Leaves room |

**Severity mapping (`_b2SeverityToB3`)** — used when routing `new_alert` from `/ws/events`:

| B2 level / score | B3 severity |
|-----------------|-------------|
| score ≥ 0.9 OR level `SEVERE` | `emergency` |
| level `HIGH` | `critical` |
| level `MODERATE` | `warning` |
| else | `informational` |

### 3.6 Map Feature Mapper
**File:** `backend/src/mappers/mapFeatureMapper.js`

Provides camera coordinates via a **hardcoded lookup table**:

```js
const CAMERA_COORDS = {
  cam_01: { lat: 6.8900, lng: 79.8553 },
  cam_02: { lat: 6.9549, lng: 79.9213 },
  // ... 8 cameras total
};
// Fallback: derives lat/lng from numeric portion of camera_id
```

> **⚠ These coordinates are not sourced from B2's `CameraRegistry` table.**

---

## 4. B3 Services & Routes

### 4.1 TrafficService
**File:** `backend/src/services/trafficService.js`

Thin pass-through to the adapter — no transformation.

| Method | Delegates To |
|--------|-------------|
| `listCameras()` | `adapter.listCameras()` |
| `getCurrentMetric(cameraId)` | `adapter.getCurrentMetric(cameraId)` |
| `getMetricHistory(cameraId, from, to)` | `adapter.getMetricHistory(cameraId, from, to)` |
| `getCurrentCongestion()` | `adapter.getCurrentCongestion()` |
| `getDashboardSummary()` | `adapter.getDashboardSummary()` |
| `getDashboardEvents(limit)` | `adapter.getDashboardEvents(limit)` |
| `getAnalyticsMetrics(start, end)` | `adapter.getAnalyticsMetrics(start, end)` |
| `streamAnalyticsReportPdf(start, end)` | `adapter.streamAnalyticsReportPdf(start, end)` |
| `getAlertHistory(params)` | `adapter.getAlertHistory(params)` |
| `acknowledgeAlert(alertId, userId)` | `adapter.acknowledgeAlert(alertId, userId)` |
| `streamAlertExport(params)` | `adapter.streamAlertExport(params)` |

### 4.2 AnalyticsService
**File:** `backend/src/services/analyticsService.js`

| B3 Method | Data Source | Notes |
|-----------|-------------|-------|
| `getSummary(cameraId, from, to)` | B2 via `getMetricHistory` | Per-camera aggregate — no B2 equivalent endpoint |
| `getTrends(cameraId, from, to)` | B2 via `getMetricHistory` | Per-camera trend — no B2 equivalent endpoint |
| `getMetrics(from, to)` | B2 via `getAnalyticsMetrics()` | ✅ Delegates to B2's SQL aggregation; real incident counts |
| `streamReportPdf(from, to)` | B2 via `streamAnalyticsReportPdf()` | ✅ Proxies B2's PDF binary stream directly |

### 4.3 AlertService
**File:** `backend/src/services/alertService.js`

| Method | Data Source | Notes |
|--------|-------------|-------|
| `listActiveAlerts()` | B2 congestion metrics (derived) | Real-time — B2 has no "list active alerts" REST endpoint |
| `getAlertHistory(options)` | B2 `AlertRecord` via `getAlertHistory()` | ✅ Real persisted data; pagination applied in B3 |
| `acknowledge(alertId, user)` | B2 (numeric IDs) / in-memory (synthetic IDs) | ✅ Numeric ID → `POST /api/alerts/{id}/acknowledge` + `X-Admin-Token`; synthetic B3 ID → in-memory |
| `streamAlertExport(params)` | B2 CSV stream via `streamAlertExport()` | ✅ Proxies B2's CSV directly |

### 4.4 DashboardService
**File:** `backend/src/services/dashboardService.js`

> ✅ **Refactored** — now proxies directly to B2. `alertService` dependency removed. All synthetic recompute logic and broken helpers (`_mapScoreToLevel`, `_eventTypeFromMetric`, `_severityFromMetric`) deleted.

| Method | Behaviour | Status |
|--------|-----------|--------|
| `getSummary()` | calls `trafficService.getDashboardSummary()` → B2 `/api/dashboard/summary` | ✅ Fixed |
| `getRecentEvents(limit)` | calls `trafficService.getDashboardEvents(limit)` → B2 `/api/dashboard/events` | ✅ Fixed |

**Previously broken behaviour removed:**
- `Math.random() * 20` for `total_incidents_24h` — replaced with real `AlertRecord` count from B2
- Duplicate response fields `active_alerts_count` and `lastUpdated` — removed
- `_mapScoreToLevel()` comparing 0–1 float against thresholds `30 / 55 / 80` — deleted (was always returning `"LOW"`)
- `_eventTypeFromMetric()` / `_severityFromMetric()` checking wrong enum values `"CRITICAL"` / `"MEDIUM"` — deleted

### 4.5 MapService
**File:** `backend/src/services/mapService.js`

| Method | Behaviour |
|--------|-----------|
| `getHeatmap()` | calls `trafficService.getCurrentCongestion()`, enriches with coords from `adminService.listCameras()` (in-memory), falls back to hardcoded coords |
| `getIncidents()` | calls `alertService.listActiveAlerts()`, enriches with hardcoded coords |

> **Does NOT call B2's `/api/map/heatmap` or `/api/map/incidents`.**

### 4.6 AdminService
**File:** `backend/src/services/adminService.js`

> **Makes no HTTP calls to B2 at all.** Fully in-memory.

| Resource | Storage | Persistence |
|----------|---------|-------------|
| Camera registry | `new Map()` in process | Lost on restart |
| Zones | `new Map()` in process | Lost on restart |
| Thresholds | JS object | Lost on restart |
| Admin token | `process.env.ADMIN_TOKEN` | Config only |

### 4.7 Routes Summary

| B3 Route | Method | Auth | Service Called |
|----------|--------|------|----------------|
| `/api/traffic/cameras` | GET | Cookie | `trafficService.listCameras()` |
| `/api/traffic/metrics/current` | GET | Cookie | `trafficService.getCurrentMetric(cameraId)` |
| `/api/traffic/metrics/history` | GET | Cookie | `trafficService.getMetricHistory(cameraId, from, to)` |
| `/api/traffic/congestion/current` | GET | Cookie | `trafficService.getCurrentCongestion()` |
| `/api/analytics/summary` | GET | Cookie | `analyticsService.getSummary(cameraId, from, to)` → per-camera metric history |
| `/api/analytics/trends/:cameraId` | GET | Cookie | `analyticsService.getTrends(cameraId, from, to)` → per-camera metric history |
| `/api/analytics/metrics` | GET | Cookie | `analyticsService.getMetrics(from, to)` → B2 `/api/analytics/metrics` ✅ |
| `/api/analytics/compare` | GET | Cookie | `analyticsService.getMetrics()` × 2 → B2 `/api/analytics/metrics` ✅ |
| `/api/analytics/report/pdf` | GET | Cookie | `analyticsService.streamReportPdf()` → B2 PDF stream ✅ |
| `/api/alerts/active` | GET | Cookie | `alertService.listActiveAlerts()` → derived from congestion metrics |
| `/api/alerts/history` | GET | Cookie | `alertService.getAlertHistory(filters)` → B2 `AlertRecord` ✅ |
| `/api/alerts/export` | GET | Cookie | `alertService.streamAlertExport()` → B2 CSV stream ✅ |
| `/api/alerts/:id/acknowledge` | POST | Cookie | `alertService.acknowledge(id, user)` → B2 (numeric) / in-memory (synthetic) ✅ |
| `/api/dashboard/summary` | GET | Cookie | `dashboardService.getSummary()` |
| `/api/dashboard/events` | GET | Cookie | `dashboardService.getRecentEvents(limit)` |
| `/api/map/heatmap` | GET | Cookie | `mapService.getHeatmap()` |
| `/api/map/incidents` | GET | Cookie | `mapService.getIncidents()` |
| `/api/admin/thresholds` | GET/PUT | Cookie + AdminToken | `adminService` (in-memory) |
| `/api/admin/zones` | GET/POST/PUT/DELETE | Cookie + AdminToken | `adminService` (in-memory) |
| `/api/admin/cameras` | GET/POST/PUT/DELETE | Cookie + AdminToken | `adminService` (in-memory) |
| `/health` | GET | None | `b2HttpClient.get("/health")` |

---

## 5. Full Wiring Map — B2 → B3

> Legend: ✅ Wired correctly | ⚠️ Partial / transformed | ❌ Not wired | 🔴 Bug / mismatch

### Traffic & Congestion

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /cameras` | ✅ Yes | `GET /api/traffic/cameras` | ✅ Correct |
| `GET /metrics/current` | ✅ Yes | `GET /api/traffic/metrics/current` | ✅ Correct (with field rename) |
| `GET /metrics/history` | ✅ Yes | `GET /api/traffic/metrics/history` | ✅ Correct |
| `GET /congestion/current` | ✅ Yes | `GET /api/traffic/congestion/current` | ✅ Correct |
| `WS /ws/metrics` | ✅ Yes | Socket.io `traffic:metrics`, `traffic:congestion` | ✅ Active — bridged via `subscribeToMetrics()` |
| `WS /ws/metrics/lanes` | ✅ Yes | Socket.io `traffic:lane_metrics` | ✅ Added — bridged via `subscribeLaneMetrics()` |
| `WS /ws/events` | ✅ Yes | Socket.io `traffic:metrics_update`, `map:heatmap`, `alert:new`, `admin:broadcast` | ✅ Added — bridged via `subscribeToEvents()` |

### Dashboard

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /api/dashboard/summary` | ✅ Yes | `GET /api/dashboard/summary` | ✅ Proxied via `getDashboardSummary()` + `mapB2DashboardSummary` |
| `GET /api/dashboard/events` | ✅ Yes | `GET /api/dashboard/events` | ✅ Proxied via `getDashboardEvents()` + `mapB2DashboardEventBatch` |

### Analytics

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /api/analytics/metrics` | ✅ Yes | `GET /api/analytics/metrics` | ✅ Proxied via `getAnalyticsMetrics()` + `mapB2AnalyticsMetrics` |
| `GET /api/analytics/compare` | ✅ Yes (×2) | `GET /api/analytics/compare` | ✅ Calls B2 metrics twice (range A + B); returns `{range_a, range_b}` |
| `GET /api/analytics/report/pdf` | ✅ Yes | `GET /api/analytics/report/pdf` | ✅ B2 PDF streamed directly via `streamGet()` + `Readable.fromWeb` |

### Alerts

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /api/alerts/history` | ✅ Yes | `GET /api/alerts/history` | ✅ Proxied via `getAlertHistory()` + `mapB2AlertOutputBatch`; pagination applied in B3 |
| `POST /api/alerts/{id}/acknowledge` | ✅ Yes (numeric IDs) | `POST /api/alerts/:id/acknowledge` | ✅ Numeric IDs → B2 via `post()` + `X-Admin-Token`; synthetic B3 IDs → in-memory |
| `GET /api/alerts/export` | ✅ Yes | `GET /api/alerts/export` | ✅ B2 CSV stream proxied via `streamGet()` + `Readable.fromWeb` |

### Admin

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /api/admin/thresholds` | ✅ Yes | `GET /api/admin/thresholds` | ✅ Proxied via `adminService.getThresholds()` + `X-Admin-Token` |
| `PUT /api/admin/thresholds` | ✅ Yes | `PUT /api/admin/thresholds` | ✅ Proxied via `adminService.updateThresholds()` |
| `GET /api/admin/zones` | ✅ Yes | `GET /api/admin/zones` | ✅ Proxied via `adminService.listZones()` |
| `POST /api/admin/zones` | ✅ Yes | `POST /api/admin/zones` | ✅ Proxied via `adminService.createZone()` |
| `PUT /api/admin/zones/:id` | ✅ Yes | `PUT /api/admin/zones/:id` | ✅ Proxied via `adminService.updateZone()` |
| `DELETE /api/admin/zones/:id` | ✅ Yes | `DELETE /api/admin/zones/:id` | ✅ Proxied via `adminService.deleteZone()` |
| `GET /api/admin/cameras` | ✅ Yes | `GET /api/admin/cameras` | ✅ Proxied via `adminService.listCameras()` |
| `POST /api/admin/cameras` | ✅ Yes | `POST /api/admin/cameras` | ✅ Proxied via `adminService.createCamera()` |
| `PUT /api/admin/cameras/:id` | ✅ Yes | `PUT /api/admin/cameras/:id` | ✅ Proxied via `adminService.updateCamera()` |
| `DELETE /api/admin/cameras/:id` | ✅ Yes | `DELETE /api/admin/cameras/:id` | ✅ Proxied via `adminService.deleteCamera()` |
| `POST /api/admin/notifications/broadcast` | ❌ No | — | ❌ Not exposed by B3 (future work) |

### Map

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /api/map/heatmap` | ⚠️ Partial | `GET /api/map/heatmap` | ⚠️ B3 builds from congestion metrics; coords now from B2 `CameraRegistry` ✅ |
| `GET /api/map/incidents` | ⚠️ Partial | `GET /api/map/incidents` | ⚠️ B3 builds from active alerts; coords now from B2 `CameraRegistry` ✅ |

### Health & ML

| B2 Endpoint | B3 Calls It? | B3 Route Exposed | Status |
|------------|--------------|-----------------|--------|
| `GET /health` | ✅ Yes | `GET /health` | ✅ Correct |
| `GET /api/predict/congestion` | ✅ Yes | `GET /api/predict/congestion` | ✅ Proxied via `getCongestionPrediction()` |

---

## 6. Field-Level Transformation Reference

### 6.1 TrafficMetric: B2 → B3 Mapper

**File:** `backend/src/mappers/b2MetricMapper.js`

| B2 Field (snake_case) | B3 Field (camelCase) | Type | Transformation |
|----------------------|---------------------|------|----------------|
| `camera_id` | `cameraId` | string | Direct rename |
| `window_start` | `windowStart` | string | ISO datetime via `toIsoOrNull()` |
| `window_end` | `windowEnd` | string | ISO datetime via `toIsoOrNull()` |
| `lane_id` | `laneId` | int \| null | Direct rename |
| `vehicle_count` | `vehicleCount` | int | Direct rename, fallback `0` |
| `counts_by_class` | `countsByClass` | object | Direct rename (B2 pre-parses JSON) |
| `avg_speed_kmh` | `averageSpeedKmh` | float | Direct rename, fallback `0` |
| `stopped_ratio` | `stoppedRatio` | float | Direct rename, fallback `0` |
| `queue_length` | `queueLength` | int | Direct rename, fallback `0` |
| `congestion_level` | `congestionLevel` | string | Rename + `.toUpperCase()` |
| `congestion_score` | `congestionScore` | float | Direct rename, fallback `0` |
| *(computed)* | `stale` | boolean | `isStale(windowEnd, TRAFFIC_STALE_AFTER_SECONDS)` |

### 6.2 Camera: B2 → B3

| B2 Field | B3 Field | Notes |
|----------|----------|-------|
| `camera_id` | `cameraId` | |
| `last_seen` | `lastSeen` | ISO via `toIsoOrNull()` |
| *(computed)* | `stale` | same stale check |

### 6.3 Dashboard Summary: B2 → B3 Mapper

**File:** `backend/src/mappers/b2MetricMapper.js` — `mapB2DashboardSummary()`

| B2 Field | B3 Field | Type | Transformation |
|----------|----------|------|----------------|
| `generated_at` | `last_updated` | string | Direct rename |
| `active_alerts` | `active_alerts` | int | Direct |
| `total_incidents_24h` | `total_incidents_24h` | int | Direct |
| `average_speed_kmh` | `avg_speed_kmh` | float | Direct rename |
| `average_congestion_score_5m` | `overall_congestion_score` | float | Direct rename |
| `average_congestion_score_5m` | `overall_congestion_level` | string | `_scoreToLevel()`: `<0.3→LOW`, `<0.55→MODERATE`, `<0.8→HIGH`, else `SEVERE` |
| `total_vehicles_last_window` | `total_vehicles` | int | Direct rename |
| `total_cameras_active` | `total_cameras_active` | int | Direct |
| `congestion_breakdown` | `congestion_breakdown` | object | Pass-through |
| `worst_camera` | `worst_camera` | object \| null | Pass-through |

### 6.4 Dashboard Event: B2 → B3 Mapper

**File:** `backend/src/mappers/b2MetricMapper.js` — `mapB2DashboardEvent()` / `mapB2DashboardEventBatch()`

| B2 Field | B3 Field(s) | Type | Transformation |
|----------|------------|------|----------------|
| `camera_id` | `cameraId`, `camera_id` | string | Both cases emitted |
| `timestamp` | `timestamp` | string | Direct |
| `vehicle_id` + `camera_id` | `id` | string | `"${cameraId}-${vehicle_id}"` |
| `class` | `vehicleClass`, `vehicle_class` | string | Both cases emitted; fallback `"unknown"` |
| `speed_kmh` | `speedKmh`, `speed_kmh` | float | Both cases emitted |
| `lane_id` | `laneId`, `lane_id` | int \| null | Both cases emitted |
| `confidence` | `confidence` | float | Direct |

### 6.6 Alert: B2 → B3 Mapper

**File:** `backend/src/mappers/b2MetricMapper.js` — `mapB2AlertOutput()` / `mapB2AlertOutputBatch()`

| B2 Field | B3 Field(s) | Type | Transformation |
|----------|------------|------|----------------|
| `id` | `id`, `alertId` | string | `String(id)` — B2 uses int PK |
| `alert_type` | `type` | string | Direct rename |
| `severity` | `severity` | string | `mapB2AlertSeverity()`: `SEVERE→emergency`, `HIGH→critical`, `MODERATE→warning`, `LOW→informational` |
| `camera_id` | `cameraId`, `camera_id` | string | Both cases emitted |
| `road_segment` | `roadSegment`, `road_segment` | string \| null | Both cases emitted |
| `title` | `title` | string | Direct |
| `message` | `description`, `message` | string | Both field names emitted |
| `congestion_level` | `congestionLevel` | string \| null | Direct rename |
| `congestion_score` | `congestionScore` | float \| null | Direct rename |
| `acknowledged` | `status` | string | `true→"acknowledged"`, `false→"active"` |
| `triggered_at` | `timestamp`, `triggeredAt` | string | Both field names emitted |
| `resolved_at` | `resolvedAt` | string \| null | Direct rename |
| `acknowledged_by` | `acknowledgedBy` | string \| null | Direct rename |
| `acknowledged_at` | `acknowledgedAt` | string \| null | Direct rename |

### 6.5 Congestion Level Enum Values

| Context | Values |
|---------|--------|
| B2 database / API response | `LOW`, `MODERATE`, `HIGH`, `SEVERE` |
| B3 alert severity mapping | expects `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` — **⚠ MEDIUM never matches B2 (Issue #1 still open)** |
| B3 frontend display | `LOW`, `MODERATE`, `HIGH`, `SEVERE` (via raw metric) |
| B3 `_scoreToLevel()` (new) | `LOW`, `MODERATE`, `HIGH`, `SEVERE` — **✅ matches B2 enum** |

---

## 7. Issues & Mismatches

### ~~Issue #1~~ — ✅ RESOLVED: Alert Severity Enum Fixed
**File:** `backend/src/mappers/alertMapper.js`

**Two bugs fixed:**
1. `score >= 90` → `score >= 0.9` — B2 congestion scores are 0–1 floats, not 0–100; this condition previously never fired
2. `level === "MEDIUM"` → `level === "MODERATE"` — B2 sends `MODERATE`, not `MEDIUM`; this made all moderate-congestion active alerts appear as `"informational"` instead of `"warning"`

Also added `level === "SEVERE"` → `"emergency"` case to cover the full B2 enum cleanly.

---

### ~~Issue #2~~ — ✅ RESOLVED: Alert History, Export, and Acknowledge Now Backed by B2
**Files changed:** `b2HttpClient.js`, `env.js`, `.env.example`, `b2MetricMapper.js`, `trafficDataProvider.js`, `b2TrafficDataAdapter.js`, `trafficService.js`, `alertService.js`, `routes/alerts.js`

**What was wrong:** All three alert endpoints used B3 in-memory state. History was lost on restart. Export generated its own CSV from in-memory data. Acknowledge only updated a local `Map`.

**What was done:**
- Added `post(path, body, extraHeaders)` to `b2HttpClient` for POST requests with custom headers
- Added `B2_ADMIN_TOKEN` env var — passed as `X-Admin-Token` when B3 calls B2's admin-protected acknowledge endpoint; also sends `X-Admin-User` with the operator's username
- Added `mapB2AlertSeverity()` — maps B2 congestion level strings (`MODERATE→warning`, `HIGH→critical`, `SEVERE→emergency`) to B3 frontend severity labels
- Added `mapB2AlertOutput()` / `mapB2AlertOutputBatch()` — full field mapping (`alert_type→type`, `camera_id→cameraId+camera_id`, `message→description+message`, `triggered_at→timestamp+triggeredAt`, etc.)
- Added `getAlertHistory(params)`, `acknowledgeAlert(alertId, userId)`, `streamAlertExport(params)` to `TrafficDataProvider` (base), `B2TrafficDataAdapter`, and `TrafficService`
- `alertService.getAlertHistory()` now calls B2 with all filters; B2's flat list is paginated in B3 (B2 has no limit/offset params)
- `alertService.acknowledge()` now branches: numeric ID → calls B2's `POST /api/alerts/{id}/acknowledge` and maps response; synthetic B3 ID (e.g. `ALERT-cam_01-…`) → in-memory only (metric-derived active alerts have no B2 `AlertRecord` row)
- `alertService.streamAlertExport()` proxies B2's CSV stream via `streamGet()`
- `/export` route proxies `Readable.fromWeb(b2Response.body).pipe(res)`; removed dead `convertAlertsToCSV` helper
- `/:id/acknowledge` route now properly `await`s the async `alertService.acknowledge()`

**Param name translation (B3 → B2):**
- `cameraId` → `camera_id`
- `alert_type` → `type` (B2 uses `type` as FastAPI Query alias)

---

### ~~Issue #3~~ — ✅ RESOLVED: Admin Now Backed by B2 PostgreSQL
**Files changed:** `b2HttpClient.js`, `adminService.js`, `routes/admin.js`, `services/mapService.js`, `services/index.js`

**What was wrong:** All admin data (cameras, zones, thresholds) lived in in-memory JS Maps/objects. Everything was lost on B3 restart. B3 and B2 had divergent registries.

**What was done:**
- Added `put(path, body, extraHeaders)` and `delete(path, extraHeaders)` to `b2HttpClient`; updated `get()` to accept `extraHeaders` so admin token can be passed
- Rewrote `adminService.js` — constructor now takes `{ httpClient }`; all CRUD methods delegate to B2's `/api/admin/*` endpoints with `X-Admin-Token: B2_ADMIN_TOKEN` header; `validateAdminToken()` kept for B3's own route guard
- Updated all 9 handler calls in `routes/admin.js` to `await` the now-async service methods; removed `adminUser` parameter forwarding (B2 handles audit internally)
- `services/index.js` passes `trafficDataProvider.httpClient` to `AdminService`

---

### ~~Issue #4~~ — ✅ RESOLVED: Analytics Now Delegates to B2
**Files changed:** `b2HttpClient.js`, `b2MetricMapper.js`, `b2TrafficDataAdapter.js`, `trafficDataProvider.js`, `trafficService.js`, `analyticsService.js`, `routes/analytics.js`

**What was wrong:** `analyticsService.getMetrics()` fetched all cameras, looped through each calling `getMetricHistory()`, and aggregated in JavaScript. The `incident_pie` was generated with `Math.random()`.

**What was done:**
- Added `streamGet()` to `b2HttpClient` — returns raw `Response` object for binary endpoints
- Added `mapB2AnalyticsMetrics()` to mapper — renames all fields (`start→range_start`, `average_congestion→avg_congestion_score`, `peak_hour_trends→peak_hour_distribution`, `incidents→incident_pie`) and maps `incidents.high`/`incidents.critical` to real `incident_pie` entries
- Added `getAnalyticsMetrics(start, end)` and `streamAnalyticsReportPdf(start, end)` to `TrafficDataProvider` (base), `B2TrafficDataAdapter` (calls `GET /api/analytics/metrics` and `GET /api/analytics/report/pdf`), and `TrafficService` (delegates)
- `analyticsService.getMetrics(from, to)` now calls `trafficService.getAnalyticsMetrics(from, to)` — B2's PostgreSQL aggregation handles peak hours, top segments, and incident counts
- `analyticsService.streamReportPdf(from, to)` proxies to B2; `routes/analytics.js` streams response body using `Readable.fromWeb(b2Response.body).pipe(res)`
- `/compare` route continues to call `getMetrics()` twice (once per range) — returns `{range_a, range_b}` matching frontend's `AnalyticsComparison` type
- `getSummary()` and `getTrends()` in `analyticsService` unchanged — they do per-camera metric-history aggregation for which B2 has no equivalent

**Parameter rename handled in adapter:**
- B3 routes accept `from`/`to` and `aFrom`/`aTo`/`bFrom`/`bTo`
- Adapter passes them as `start`/`end` to B2 (B2's actual param names)

---

### ~~Issue #5~~ — ✅ RESOLVED: Map Coordinates Now from B2 CameraRegistry
**Files changed:** `services/mapService.js` (cascade from Issue #3 fix)

**What was wrong:** `MapService.getHeatmap()` and `getIncidents()` called `adminService.listCameras()` synchronously — which returned an in-memory empty array — then fell back to `mapFeatureMapper.js`'s hardcoded table.

**What was done:**
- `mapService.js` both heatmap and incidents methods now `await adminService.listCameras()`, which returns real camera data (including `latitude`/`longitude`) from B2's `CameraRegistry` table
- `mapFeatureMapper.CAMERA_COORDINATES` table remains as a last-resort fallback for cameras that exist in B2 metrics but have not been registered in `CameraRegistry`

---

### ~~Issue #6~~ — ✅ RESOLVED: Dashboard Summary Proxied to B2
See full resolution notes in [Issue #6 resolved entry](#issue-6--resolved-dashboard-summary-now-proxied-to-b2) above.

---

### ~~Issue #7~~ — ✅ RESOLVED: Dashboard Events Proxied to B2
See full resolution notes in [Issue #7 resolved entry](#issue-7--resolved-dashboard-events-now-proxied-to-b2) above.

---

### ~~Issue #8~~ — ✅ RESOLVED: All Three WebSocket Feeds Now Wired
**Files changed:** `env.js`, `trafficDataProvider.js`, `b2TrafficDataAdapter.js`, `socket.js`, `.env.example`

**What was wrong:** `B2WebSocketClient` was implemented but none of the three B2 WebSocket endpoints (`/ws/metrics`, `/ws/metrics/lanes`, `/ws/events`) were subscribed to. B3 relied entirely on HTTP polling for metric data.

**What was done:**
- Added `B2_WS_LANES_URL` and `B2_WS_EVENTS_URL` to `env.js` with correct defaults
- Added `subscribeLaneMetrics()` and `subscribeToEvents()` abstract stubs to `TrafficDataProvider`
- `B2TrafficDataAdapter` constructor now accepts `laneMetricsClient` and `eventsClient`; both new methods implemented; factory creates all three `B2WebSocketClient` instances
- `socket.js` rewritten to subscribe to all three feeds and emit typed Socket.io events:
  - `/ws/metrics` → `traffic:metrics`, `traffic:congestion` (unchanged behaviour, now confirmed active)
  - `/ws/metrics/lanes` → `traffic:lane_metrics` (per-camera lane rooms via `lanes:subscribe`)
  - `/ws/events` → `traffic:metrics_update`, `map:heatmap`, `alert:new`, `admin:broadcast`
- `unsubscribe()` in `server.js` now cleanly tears down all three connections on shutdown

---

### ~~Issue #9~~ — ✅ RESOLVED: Prediction Endpoint Now Exposed
**Files changed:** `trafficDataProvider.js`, `b2TrafficDataAdapter.js`, `trafficService.js`, `routes/predict.js` (new), `app.js`

**What was done:**
- Added `getCongestionPrediction(cameraId, horizonMinutes, lookbackMinutes)` stub to provider, implementation in adapter (calls `GET /api/predict/congestion`), and delegate in `TrafficService`
- Created `routes/predict.js` with `GET /api/predict/congestion` — accepts `cameraId`/`camera_id`, `horizonMinutes` (1–30), `lookbackMinutes` (1–120); validates cameraId; proxies to B2
- Registered under `/api/predict` in `app.js` with `requireAuth`

---

### ~~Issue #10~~ — ✅ RESOLVED: Acknowledge Now Writes to B2
`alertService.acknowledge()` branches on ID type: numeric → `POST /api/alerts/{id}/acknowledge` with `X-Admin-Token`; synthetic B3 IDs (metric-derived active alerts) → in-memory only. Since history now comes from B2 (numeric IDs), most real-world acks are written to B2's `AlertRecord`.

---

### ~~Issue #11~~ — ✅ RESOLVED: PDF Now Streamed from B2
`analyticsService.streamReportPdf()` proxies B2's `GET /api/analytics/report/pdf` binary stream via `streamGet()` + `Readable.fromWeb().pipe(res)`. PDFKit removed from the analytics route.

---

## 8. Risk Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Alert severity enum mismatch — `alertMapper.js` checked `"MEDIUM"`, B2 sends `"MODERATE"` | 🔴 Critical | ✅ Fixed |
| 2 | Alert history / export / acknowledge not backed by B2 | 🔴 Critical | ✅ Fixed |
| 3 | Admin cameras / zones / thresholds in-memory only | 🔴 Critical | ✅ Fixed |
| 4 | Analytics `incident_pie` was random mocked data | 🔴 Critical | ✅ Fixed |
| 5 | Map heatmap / incidents used hardcoded camera coords | 🔴 Critical | ✅ Fixed |
| 6 | Dashboard summary recomputed with duplicate fields | ⚠️ Medium | ✅ Fixed |
| 7 | Dashboard events synthetic — no real `TrafficEvent` data | ⚠️ Medium | ✅ Fixed |
| 8 | All 3 B2 WebSocket feeds unused | ⚠️ Medium | ✅ Fixed |
| 9 | B2 prediction endpoint not exposed by B3 | ⚠️ Medium | ✅ Fixed |
| 10 | Alert acknowledge not written back to B2 | ℹ️ Low | ✅ Fixed (numeric IDs) |
| 11 | Analytics PDF generated by B3 from re-implemented data | ℹ️ Low | ✅ Fixed |

### Correctly Wired (no issues)

- `GET /cameras` → `GET /api/traffic/cameras` ✅
- `GET /metrics/current` → `GET /api/traffic/metrics/current` ✅
- `GET /metrics/history` → `GET /api/traffic/metrics/history` ✅
- `GET /congestion/current` → `GET /api/traffic/congestion/current` ✅
- `GET /health` → `GET /health` ✅
- `GET /api/dashboard/summary` → B3 `/api/dashboard/summary` ✅ *(wired 2026-05-12)*
- `GET /api/dashboard/events` → B3 `/api/dashboard/events` ✅ *(wired 2026-05-12)*
- `WS /ws/metrics` → Socket.io `traffic:metrics`, `traffic:congestion` ✅ *(confirmed active 2026-05-12)*
- `WS /ws/metrics/lanes` → Socket.io `traffic:lane_metrics` ✅ *(wired 2026-05-12)*
- `WS /ws/events` → Socket.io `traffic:metrics_update`, `map:heatmap`, `alert:new`, `admin:broadcast` ✅ *(wired 2026-05-12)*
- `GET /api/analytics/metrics` → B3 `/api/analytics/metrics` ✅ *(wired 2026-05-12)*
- `GET /api/analytics/compare` → B3 `/api/analytics/compare` ✅ *(wired 2026-05-12)*
- `GET /api/analytics/report/pdf` → B3 `/api/analytics/report/pdf` ✅ *(wired 2026-05-12)*
- `GET /api/alerts/history` → B3 `/api/alerts/history` ✅ *(wired 2026-05-12)*
- `POST /api/alerts/{id}/acknowledge` → B3 `/api/alerts/:id/acknowledge` ✅ *(wired 2026-05-12, numeric IDs)*
- `GET /api/alerts/export` → B3 `/api/alerts/export` ✅ *(wired 2026-05-12)*
- `GET /api/admin/thresholds` + `PUT` → B3 `/api/admin/thresholds` ✅ *(wired 2026-05-12)*
- `GET /api/admin/zones` + `POST/PUT/DELETE` → B3 `/api/admin/zones` ✅ *(wired 2026-05-12)*
- `GET /api/admin/cameras` + `POST/PUT/DELETE` → B3 `/api/admin/cameras` ✅ *(wired 2026-05-12)*
- `GET /api/predict/congestion` → B3 `/api/predict/congestion` ✅ *(wired 2026-05-12)*

---

### All Issues Resolved ✅

All 11 original issues have been addressed. The only remaining gap is:

| Endpoint | Status | Note |
|----------|--------|------|
| `POST /api/admin/notifications/broadcast` | ❌ Not wired | B2 WebSocket broadcast to operators — no B3 route currently exposed |

---

*Generated: 2026-05-12 | Last updated: 2026-05-12 — all 11 issues resolved | Codebase: `services/b2-data` + `services/b3-dashboard/backend`*
