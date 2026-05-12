# Traffic Officer Dashboard → B3 BFF — Full Wiring Report

Complete analysis of every connection between the Traffic Officer Dashboard frontend (Next.js, port 3000) and the B3 BFF backend (Express.js, port 5000), including all REST calls, Socket.io events, type consistency, mismatches, and gaps.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Session Flow](#2-authentication--session-flow)
3. [REST Endpoint Connections — by Feature](#3-rest-endpoint-connections--by-feature)
4. [Socket.io Event Connections](#4-socketio-event-connections)
5. [Next.js Server-Side Proxy Routes (B2 Bypass)](#5-nextjs-server-side-proxy-routes-b2-bypass)
6. [Hook Layer — Polling & Refresh Intervals](#6-hook-layer--polling--refresh-intervals)
7. [Full Connection Status Table](#7-full-connection-status-table)
8. [Type Mismatches](#8-type-mismatches)
9. [Hardcoded Values & Config](#9-hardcoded-values--config)
10. [Missing & Broken Connections](#10-missing--broken-connections)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Traffic Officer Dashboard (Next.js — port 3000)        │
│                                                         │
│  Browser                                                │
│  ├─ b3-backend.ts (REST client)  → B3 BFF :5000        │
│  ├─ socket.ts (Socket.io client) → B3 BFF :5000        │
│  └─ AuthGate / SideNavBar        → B3 BFF :5000        │
│                                                         │
│  Next.js Server (SSR only)                              │
│  └─ /api/b2/* route handlers    → B2 directly :18000   │
│     (NOT called by any browser component — see §5)      │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTP + cookies
                    Socket.io WS
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  B3 BFF (Express.js — port 5000)                        │
└─────────────────────────────────────────────────────────┘
                          │
               HTTP + WS × 3
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  B2 Data Service (FastAPI — port 18000)                 │
│  PostgreSQL + Kafka                                      │
└─────────────────────────────────────────────────────────┘
```

**Key design points:**
- The browser **never** calls B2 directly. All calls go through B3 BFF at port 5000.
- The Next.js `/api/b2/*` server-side routes **exist in source but are not called by any browser component**. They are a leftover adapter layer (see §5).
- Auth is cookie-based — every `fetch()` and Socket.io connection includes `withCredentials: true`.

---

## 2. Authentication & Session Flow

### Session check on every page load

**File:** `src/components/auth/AuthGate.tsx`

```
Browser mount
  └─ fetch(${NEXT_PUBLIC_BACKEND_URL}/api/auth/me, { credentials: "include" })
        ├─ 200 OK  → render page
        └─ 401/error → window.location = NEXT_PUBLIC_LOGIN_APP_URL
```

**B3 BFF endpoint:** `GET /api/auth/me` — decodes the `access_token` httpOnly cookie and returns:
```json
{ "sub": "...", "preferred_username": "...", "email": "...", "realm_access": { "roles": [...] } }
```

### Logout

**File:** `src/components/layout/SideNavBar.tsx`

```
User clicks logout
  └─ fetch(${NEXT_PUBLIC_BACKEND_URL}/api/auth/logout, { method: "POST", credentials: "include" })
        └─ then → window.location = NEXT_PUBLIC_LOGIN_APP_URL
```

**B3 BFF endpoint:** `GET /api/auth/logout` — clears all auth cookies.

### Role check

`AuthGate.tsx` checks that the authenticated user has the `"operator"` or `"admin"` Keycloak realm role. If not, redirects to login.

---

## 3. REST Endpoint Connections — by Feature

All REST calls use `b3-backend.ts` → `fetch(url, { credentials: "include" })` to B3 BFF at `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:5000`).

---

### 3.1 Dashboard Page

**File:** `src/app/dashboard/page.tsx`  
Data fetching is delegated to the child components below.

#### KPISummaryRow (`src/components/dashboard/KPISummaryRow.tsx`)

| Call | Method | B3 BFF Endpoint | Params | Response type | Interval |
|------|--------|-----------------|--------|---------------|----------|
| `useDashboardSummary()` | GET | `/api/dashboard/summary` | — | `DashboardSummary` | 10 000 ms |
| `useCurrentCongestion()` | GET | `/api/traffic/congestion/current` | — | `TrafficMetric[]` | 10 000 ms |

**Fields used from `DashboardSummary`:**
- `total_incidents_24h` — KPI card "Incidents / 24h"
- `avg_speed_kmh` — KPI card "Avg Speed"
- `overall_congestion_level` — KPI card colour
- `overall_congestion_score` — progress bar
- `active_alerts` / `active_alerts_count` — KPI card (reads both variants)
- `last_updated` / `lastUpdated` — stale-data check (reads both variants)

#### LiveEventFeed (`src/components/dashboard/LiveEventFeed.tsx`)

| Call | Method | B3 BFF Endpoint | Params | Response type | Interval |
|------|--------|-----------------|--------|---------------|----------|
| `useDashboardEvents(10)` | GET | `/api/dashboard/events?limit=10` | `limit=10` | `DashboardEvent[]` | 10 000 ms |

**Fields used:**
- `camera_id` / `cameraId`, `timestamp`, `vehicleClass` / `vehicle_class`, `speedKmh` / `speed_kmh`, `laneId` / `lane_id`

#### ChartPanel (`src/components/dashboard/ChartPanel.tsx`)

| Call | Method | B3 BFF Endpoint | Params | Response type | When |
|------|--------|-----------------|--------|---------------|------|
| `b3Backend.traffic.listCameras()` | GET | `/api/traffic/cameras` | — | `TrafficCamera[]` | On mount |
| `b3Backend.traffic.getMetricHistory(cameraId, from, to)` | GET | `/api/traffic/metrics/history?cameraId=X&from=ISO&to=ISO` | required | `TrafficMetric[]` | On camera/range change |

**Time ranges:** 1H, 6H, 24H lookback windows.

#### SystemActions (`src/components/dashboard/SystemActions.tsx`)

| Call | Method | B3 BFF Endpoint | Interval |
|------|--------|-----------------|----------|
| `useB3Health()` | GET | `/health` | 10 000 ms |

**Fields used from `HealthStatus`:** `status`, `upstream.b2.status`, `upstream.b2.kafka`, `upstream.b2.postgres`

---

### 3.2 Alerts Page

**File:** `src/app/alerts/page.tsx`

| Call | Method | B3 BFF Endpoint | Params | Response type | Interval |
|------|--------|-----------------|--------|---------------|----------|
| `useActiveAlerts()` | GET | `/api/alerts/active` | — | `TrafficAlert[]` | 10 000 ms |
| `useAlertHistory(filters, limit, offset)` | GET | `/api/alerts/history` | `cameraId, severity, from, to, limit, offset` | `AlertHistory` | On filter change |
| `b3Backend.traffic.getCurrentCongestionTyped()` | GET | `/api/traffic/congestion/current` | — | `TrafficMetric[]` | 10 000 ms |
| `b3Backend.alerts.acknowledge(alertId)` | POST | `/api/alerts/{alertId}/acknowledge` | path param | `{ alertId, acknowledgedAt, acknowledgedBy }` | On action |
| `b3Backend.alerts.getExportCsvUrl(filters)` | — | `/api/alerts/export?…` | filter params | URL string (no fetch) | On download |

**Alert History filters sent:**

| Frontend param | B3 BFF query param | Notes |
|---------------|-------------------|-------|
| `cameraId` | `cameraId` | ✅ B3 route accepts both `cameraId` and `camera_id` |
| `severity` | `severity` | Pass-through |
| `from` | `from` | ISO 8601 |
| `to` | `to` | ISO 8601 |
| `limit` | `limit` | Default 100, max 5000 |
| `offset` | `offset` | Default 0 |

---

### 3.3 Analytics Page

**File:** `src/app/analytics/page.tsx`  
(Reports page is a `re-export` alias to analytics — identical calls.)

| Call | Method | B3 BFF Endpoint | Params | Response type | Interval |
|------|--------|-----------------|--------|---------------|----------|
| `useAnalyticsSummary(cameraId, from, to)` | GET | `/api/analytics/summary?cameraId=X&from=ISO&to=ISO` | required | `AnalyticsSummary` | 15 000 ms |
| `useAnalyticsMetrics(from, to)` | GET | `/api/analytics/metrics?from=ISO&to=ISO` | required | `AnalyticsMetrics` | 15 000 ms |
| `useAnalyticsComparison(aFrom, aTo, bFrom, bTo)` | GET | `/api/analytics/compare?aFrom=ISO&aTo=ISO&bFrom=ISO&bTo=ISO` | required | `AnalyticsComparison` | 30 000 ms |
| `useAnalyticsTrends(cameraId, from, to)` | GET | `/api/analytics/trends/{cameraId}?from=ISO&to=ISO` | required | `AnalyticsTrend` | One-shot |
| `b3Backend.traffic.getCurrentCongestionTyped()` | GET | `/api/traffic/congestion/current` | — | `TrafficMetric[]` | 10 000 ms |
| `b3Backend.health.check()` | GET | `/health` | — | `HealthStatus` | 10 000 ms |
| `b3Backend.analytics.getReportPdfUrl(from, to)` | — | `/api/analytics/report/pdf?from=ISO&to=ISO` | — | URL string (no fetch) | On download |

**Time range presets:** Last 1H, 6H, 24H, 7 days, 30 days.

**`AnalyticsMetrics` fields used:**
- `avg_congestion_score` — KPI card
- `peak_hour_distribution[]` — `{ hour, avg_vehicle_count, avg_congestion_score }` — bar chart
- `top_segments[]` — `{ camera_id, road_segment, avg_congestion_score, severe_minutes }` — table
- `incident_pie[]` — `{ severity, count }` — pie chart

**`AnalyticsSummary` fields used:**
- `totalVehicles`, `totalWindows`, `averageCongestionScore`, `averageSpeedKmh`, `peakWindow`, `series[]`

---

### 3.4 Maps Page

**File:** `src/app/maps/page.tsx` → `MapFeatureShell`

| Call | Method | B3 BFF Endpoint | Params | Response type | Interval |
|------|--------|-----------------|--------|---------------|----------|
| `useMapHeatmap()` | GET | `/api/map/heatmap` | — | `HeatmapPoint[]` | 10 000 ms |
| `useMapIncidents()` | GET | `/api/map/incidents` | — | `MapIncident[]` | 10 000 ms |
| direct `fetch(${backendUrl}/api/locations)` | GET | `/api/locations` | — | `LocationPoint[]` | 10 s polling |

**`HeatmapPoint` fields used:** `camera_id`/`cameraId`, `latitude`/`lat`, `longitude`/`lng`, `weight`, `vehicleCount`/`vehicle_count`

**`MapIncident` fields used:** `alertId`/`alert_id`, `cameraId`/`camera_id`, `latitude`/`lat`, `longitude`/`lng`, `severity`, `title`, `timestamp`/`triggered_at`

**`LocationPoint` fields used:** `cameraId`/`camera_id`, `latitude`/`lat`, `longitude`/`lng`

**Google Maps config:**
- API key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Map ID: `NEXT_PUBLIC_GOOGLE_MAPS_ID`
- Default centre (hardcoded): `{ lat: 6.9108, lng: 79.8699 }` — Borella, Colombo

---

## 4. Socket.io Event Connections

**Client file:** `src/lib/socket.ts`  
**Connection:** `io(NEXT_PUBLIC_BACKEND_URL, { withCredentials: true, transports: ["websocket", "polling"] })`  
**B3 BFF Socket.io server:** `server.js` → `socket.js`

### Events the frontend subscribes to

| Socket.io Event | Data Shape | Source (B3 socket.js) | Components Listening |
|-----------------|-----------|----------------------|---------------------|
| `traffic:metrics` | `TrafficMetric[]` (camelCase) | B2 `/ws/metrics` → mapped | `LiveEventFeed`, `SystemActions` |
| `traffic:congestion` | `TrafficMetric[]` (camelCase) | B2 `/ws/metrics` → mapped (alias) | `KPISummaryRow`, `ChartPanel`, `CongestionIndexChart`, `CongestedSegmentsTable`, `KPIRow` |
| `alert:new` | single alert object | B2 `/ws/events` `new_alert` + metric-derived | `CriticalAlertBanner`, `KPISummaryRow` |
| `connect` | — | Socket.io built-in | `KPISummaryRow`, `SystemActions`, `LiveEventFeed` |
| `disconnect` | — | Socket.io built-in | `KPISummaryRow`, `SystemActions`, `LiveEventFeed` |
| `ping` / `pong` | — | Socket.io built-in | `SystemActions` (latency measurement) |

### Events NOT subscribed to (emitted by B3 but unused by frontend)

| Socket.io Event | Emitted by B3 | Not used in any component |
|-----------------|--------------|--------------------------|
| `traffic:metrics_update` | `/ws/events traffic_metrics_update` | — |
| `traffic:lane_metrics` | `/ws/metrics/lanes` | — |
| `map:heatmap` | `/ws/events heatmap_update` | — (frontend polls REST instead) |
| `admin:broadcast` | `/ws/events admin_broadcast` | — |

### Client-to-server room subscriptions

The dashboard **does not** send `traffic:subscribe` or `lanes:subscribe` room-join events. It receives **all-camera** broadcasts only.

---

## 5. Next.js Server-Side Proxy Routes (B2 Bypass)

**Directory:** `src/app/api/b2/`  
**Server-side adapter file:** `src/lib/b2.ts`

These Next.js route handlers make **server-side calls directly to B2 (port 18000)**, bypassing B3 BFF entirely.

| Next.js Route | B2 Endpoint Called | Used by any component? |
|--------------|-------------------|----------------------|
| `GET /api/b2/cameras` | B2 `GET /cameras` | ⚠️ **No browser component calls this** |
| `GET /api/b2/health` | B2 `GET /health` | ⚠️ **No browser component calls this** |
| `GET /api/b2/metrics/current?camera_id=X` | B2 `GET /metrics/current?camera_id=X` | ⚠️ **No browser component calls this** |
| `GET /api/b2/metrics/history?camera_id=X&from=&to=` | B2 `GET /metrics/history?camera_id=X&from=&to=` | ⚠️ **No browser component calls this** |
| `GET /api/b2/congestion/current` | B2 `GET /congestion/current` | ⚠️ **No browser component calls this** |

**Assessment:** These five routes are a **dead code path** — all browser components use `b3-backend.ts` (port 5000) not `/api/b2/*`. They were likely created as an early alternative to the B3 BFF adapter but were superseded.  
**Risk:** They use `B2_API_URL` env var (default `http://localhost:18000`), which bypasses auth, field mapping, and all B3 middleware. If any component were accidentally wired to them, it would receive raw B2 snake_case data with no auth enforcement.

---

## 6. Hook Layer — Polling & Refresh Intervals

**File:** `src/lib/hooks/useB3Backend.ts`

All hooks use `usePollingResource()` — fetches on mount, then re-fetches on `setInterval`.

| Hook | Endpoint | Refresh interval | On error |
|------|----------|-----------------|----------|
| `useDashboardSummary(ms)` | `GET /api/dashboard/summary` | 10 000 ms | keeps last data |
| `useDashboardEvents(limit, ms)` | `GET /api/dashboard/events?limit=N` | 10 000 ms | keeps last data |
| `useCurrentCongestion(ms)` | `GET /api/traffic/congestion/current` | 10 000 ms | keeps last data |
| `useActiveAlerts()` | `GET /api/alerts/active` | 10 000 ms (hardcoded) | resets to null |
| `useAlertHistory(filters, limit, offset)` | `GET /api/alerts/history?...` | one-shot (no interval) | resets to null |
| `useAnalyticsSummary(cameraId, from, to)` | `GET /api/analytics/summary?...` | 15 000 ms | keeps last data |
| `useAnalyticsMetrics(from, to)` | `GET /api/analytics/metrics?...` | 15 000 ms | keeps last data |
| `useAnalyticsComparison(aFrom, aTo, bFrom, bTo)` | `GET /api/analytics/compare?...` | 30 000 ms | keeps last data |
| `useAnalyticsTrends(cameraId, from, to)` | `GET /api/analytics/trends/{cameraId}?...` | one-shot (no interval) | resets to null |
| `useMapHeatmap(ms)` | `GET /api/map/heatmap` | 10 000 ms | keeps last data |
| `useMapIncidents(ms)` | `GET /api/map/incidents` | 10 000 ms | keeps last data |
| `useB3Health(ms)` | `GET /health` | 10 000 ms | keeps last data |
| `useAcknowledgeAlert()` | `POST /api/alerts/{id}/acknowledge` | — (on-demand) | throws |

**Error strategy:** On network failure, most hooks retain the last successful `data` value and set `error`. No automatic retry logic is implemented — the next scheduled poll will retry.

---

## 7. Full Connection Status Table

### REST Endpoints

| B3 BFF Endpoint | Called from frontend? | Hook / caller | Connected? |
|----------------|----------------------|---------------|-----------|
| `GET /api/auth/me` | `AuthGate.tsx` | Direct fetch | ✅ |
| `GET /api/auth/logout` | `SideNavBar.tsx` | Direct fetch | ✅ |
| `GET /api/dashboard/summary` | `KPISummaryRow` | `useDashboardSummary` | ✅ |
| `GET /api/dashboard/events` | `LiveEventFeed` | `useDashboardEvents` | ✅ |
| `GET /api/alerts/active` | `alerts/page.tsx` | `useActiveAlerts` | ✅ |
| `GET /api/alerts/history` | `alerts/page.tsx`, `AlertHistory` | `useAlertHistory` | ✅ |
| `GET /api/alerts/export` | `alerts/page.tsx` | URL construction only | ✅ (URL built, no fetch) |
| `POST /api/alerts/:id/acknowledge` | `AlertDetailPanel`, `alerts/page.tsx` | `useAcknowledgeAlert` | ✅ |
| `GET /api/analytics/summary` | `analytics/page.tsx` | `useAnalyticsSummary` | ✅ |
| `GET /api/analytics/trends/:cameraId` | `PeakHourChart` | `useAnalyticsTrends` | ✅ |
| `GET /api/analytics/metrics` | `analytics/page.tsx` | `useAnalyticsMetrics` | ✅ |
| `GET /api/analytics/compare` | `analytics/page.tsx` | `useAnalyticsComparison` | ✅ |
| `GET /api/analytics/report/pdf` | `analytics/page.tsx` | URL construction only | ✅ (URL built, no fetch) |
| `GET /api/traffic/cameras` | `ChartPanel` | Direct `b3Backend` call | ✅ |
| `GET /api/traffic/metrics/current` | — | Not called from any component | ⚠️ Unused |
| `GET /api/traffic/metrics/history` | `ChartPanel` | Direct `b3Backend` call | ✅ |
| `GET /api/traffic/congestion/current` | Multiple | `useCurrentCongestion` | ✅ |
| `GET /api/map/heatmap` | `MapFeatureShell` | `useMapHeatmap` | ✅ |
| `GET /api/map/incidents` | `IncidentMarkers` | `useMapIncidents` | ✅ |
| `GET /api/locations` | `GoogleMap.tsx` | Direct fetch | ✅ |
| `GET /health` | `SystemActions`, `analytics/page.tsx` | `useB3Health` | ✅ |
| `GET /api/predict/congestion` | — | Not called from any component | ⚠️ Unused (newly added) |
| `GET /api/admin/*` | — | Not called from traffic dashboard | ℹ️ Admin dashboard only |

### Socket.io Events

| Event | B3 emits it? | Frontend subscribes? | Status |
|-------|-------------|---------------------|--------|
| `traffic:metrics` | ✅ | ✅ `LiveEventFeed`, `SystemActions` | ✅ Connected |
| `traffic:congestion` | ✅ | ✅ `KPISummaryRow`, `ChartPanel`, and 3 analytics components | ✅ Connected |
| `alert:new` | ✅ | ✅ `CriticalAlertBanner`, `KPISummaryRow` | ✅ Connected |
| `connect` / `disconnect` | ✅ (built-in) | ✅ 3 components | ✅ Connected |
| `ping` / `pong` | ✅ (built-in) | ✅ `SystemActions` | ✅ Connected |
| `traffic:metrics_update` | ✅ | ❌ No component subscribes | ⚠️ Wasted event |
| `traffic:lane_metrics` | ✅ | ❌ No component subscribes | ⚠️ Wasted event |
| `map:heatmap` | ✅ | ❌ Frontend polls REST instead | ⚠️ Wasted event |
| `admin:broadcast` | ✅ | ❌ No component subscribes | ⚠️ Wasted event |

---

## 8. Type Mismatches

### 8.1 Congestion Level Enum — Wrong values in frontend types

**Severity:** Medium — runtime bug for SEVERE/MODERATE cameras

| File | Type field | Frontend enum | Actual B2/B3 values | Impact |
|------|-----------|---------------|---------------------|--------|
| `src/lib/socket.ts:17` | `TrafficMetric.congestionLevel` | `"LOW"\|"MEDIUM"\|"HIGH"\|"CRITICAL"` | `"LOW"\|"MODERATE"\|"HIGH"\|"SEVERE"` | Conditional rendering on `"CRITICAL"` or `"MEDIUM"` never matches |
| `src/lib/b2.ts:16` | `TrafficMetric.congestion_level` | `"LOW"\|"MEDIUM"\|"HIGH"\|"CRITICAL"` | Same | Only affects SSR routes (which are unused anyway) |
| `src/lib/b3-backend.ts:58` | `TrafficMetric.congestionLevel` | `"LOW"\|"MEDIUM"\|"HIGH"\|"CRITICAL"` | `"LOW"\|"MODERATE"\|"HIGH"\|"SEVERE"` | Same runtime mismatch |

**Fix required:** Change frontend `TrafficMetric.congestionLevel` enum to `"LOW" | "MODERATE" | "HIGH" | "SEVERE"` in all three files. Also update any `if (level === "CRITICAL")` or `if (level === "MEDIUM")` conditional checks.

### 8.2 DashboardSummary — Dual field names

**Severity:** Low — currently handled by optional chaining in components

The frontend `DashboardSummary` type (`b3-backend.ts:71`) declares both variants:
```typescript
active_alerts?: number;
active_alerts_count?: number;  // duplicate
last_updated?: string;
lastUpdated?: string;          // duplicate
```
B3 BFF now returns only `active_alerts` and `last_updated` (duplicates removed). The TypeScript types are overly permissive but won't cause runtime errors — components that read `active_alerts_count` get `undefined` and fall back to `active_alerts`.

### 8.3 AlertHistoryItem — Incomplete type vs actual response

**Severity:** Low — frontend reads only a subset of available fields

Frontend `AlertHistoryItem` (`b3-backend.ts:22`) only declares:
```typescript
{ alertId: string; acknowledgedBy: string; acknowledgedAt: string; status: "acknowledged" }
```
B3 BFF now returns full `AlertOutput` objects (with `title`, `description`, `severity`, `cameraId`, `congestionScore`, etc.) mapped by `mapB2AlertOutput()`. The frontend only reads the four declared fields and ignores the rest — functionally correct but the type is under-declared.

### 8.4 MapIncident — All fields duplicated

**Severity:** Informational — intentional defensive coding

Frontend reads `alertId || alert_id`, `cameraId || camera_id`, `lat || latitude`, `lng || longitude`, `timestamp || triggered_at` etc. B3 BFF's `mapB2AlertOutput` deliberately emits both camelCase and snake_case. No mismatch, just noisy.

### 8.5 TrafficCamera — ID field inconsistency

**Severity:** Low — components check all variants

`b3-backend.ts:63`: `{ id: string; cameraId?: string; camera_id?: string; name?: string; label?: string }`  
B3 BFF returns `{ cameraId: string; lastSeen: string; stale: boolean }` from `mapB2Camera()`. The `id` field expected by the type is absent — B2's camera list returns `camera_id`, not a numeric `id`. `ChartPanel` reads `camera.cameraId || camera.id` to handle both shapes.

---

## 9. Hardcoded Values & Config

| Location | Value | Should be config? |
|----------|-------|------------------|
| `AuthGate.tsx:9-12` | `NEXT_PUBLIC_BACKEND_URL \|\| "http://localhost:5000"` | ✅ Already in env var |
| `AuthGate.tsx:10` | `NEXT_PUBLIC_LOGIN_APP_URL \|\| "http://localhost:3003/login"` | ✅ Already in env var |
| `socket.ts:43` | `NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"` | ✅ Already in env var |
| `b2.ts:31` | `B2_API_URL ?? "http://localhost:18000"` | ✅ Server-side env var |
| `GoogleMap.tsx:28` | `{ lat: 6.9108, lng: 79.8699 }` — Borella default centre | ℹ️ Low — reasonable geographic default |
| `MapFeatureShell.tsx:21` | Same Colombo centre coordinates | ℹ️ Same |
| `useB3Backend.ts:87` | `refreshMs = 10000` defaults per hook | ℹ️ Low — reasonable defaults |
| `useActiveAlerts:273` | `setInterval(fetchAlerts, 10000)` | ℹ️ Hardcoded, not a param — minor inconsistency vs other hooks |
| `.env.local` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy…` | ⚠️ API key should not be committed |

---

## 10. Missing & Broken Connections

### 10.1 `GET /api/traffic/metrics/current` — Never called

B3 BFF exposes `GET /api/traffic/metrics/current?cameraId=X` and it is declared in `b3Backend.traffic.getCurrentMetric()`, but **no component calls it**. Per-camera current metrics are obtained differently — either from the bulk `congestion/current` list or from `metrics/history`.

### 10.2 `GET /api/predict/congestion` — Never called

Newly wired to B2's ST-GCN model in this sprint. No frontend component exists for it yet.

### 10.3 Socket.io events emitted but never consumed

`traffic:metrics_update`, `traffic:lane_metrics`, `map:heatmap`, `admin:broadcast` — B3 emits these but no dashboard component subscribes. In particular, the real-time `map:heatmap` event (pushed every 10s from B2) is ignored; the map instead polls `GET /api/map/heatmap` every 10s via REST — functionally equivalent but wastes a real-time push.

### 10.4 SystemActions buttons — UI only, no handlers

**File:** `src/components/dashboard/SystemActions.tsx`

Four action buttons exist with no `onClick` implementation:
- Reboot Camera
- Apply Slowdown Zone
- Update VMS Message
- Sync Sensors

No corresponding B3 BFF endpoints exist for these operations.

### 10.5 Alert "Assign to Zone" — UI only

**File:** `src/components/alerts/AlertDetailPanel.tsx`

The zone-assignment dropdown is rendered but has no `onChange` handler and no B3 BFF endpoint to call.

### 10.6 `CameraDetailModal` — Referenced but missing

**File:** `src/components/analytics/CongestedSegmentsTable.tsx:7`

```typescript
import CameraDetailModal from "../modals/CameraDetailModal";
```

This import resolves to a non-existent file. Any click on a top-segment row that opens the modal will throw a module-not-found error at runtime.

### 10.7 No Socket.io fallback on disconnect

When Socket.io disconnects (component shows "RECONNECTING…"), components that rely on live `traffic:congestion` events for data display stale or no data. The REST polling (`useCurrentCongestion` at 10s) continues independently but **components that merge live Socket.io updates into their state do not re-trigger a REST fetch on disconnect**. The user sees stale chart data until Socket.io reconnects.

### 10.8 `/api/b2/*` Next.js routes — Dead code, security risk

Five server-side proxy routes call B2 directly, bypassing B3 BFF auth and field mapping. **No browser component calls them.** If accidentally linked, they would expose unauthenticated raw B2 data. Should be removed.

---

## Summary

| Area | Status |
|------|--------|
| Auth (session check, logout) | ✅ Fully connected |
| Dashboard KPIs | ✅ Fully connected |
| Dashboard live events | ✅ Fully connected |
| Dashboard charts (history) | ✅ Fully connected |
| Dashboard system health | ✅ Fully connected |
| Alerts (active, history, ack, export) | ✅ Fully connected |
| Analytics (summary, trends, metrics, compare, PDF) | ✅ Fully connected |
| Map (heatmap, incidents, location pins) | ✅ Fully connected |
| Socket.io live metric feed | ✅ Fully connected |
| Socket.io alert notifications | ✅ Fully connected |
| `GET /api/traffic/metrics/current` | ⚠️ Wired in BFF, not called by frontend |
| `GET /api/predict/congestion` | ⚠️ Wired in BFF, no frontend component yet |
| Real-time `map:heatmap` Socket.io event | ⚠️ BFF emits it, frontend polls REST instead |
| `traffic:lane_metrics` / `admin:broadcast` events | ⚠️ BFF emits, nothing subscribes |
| `congestionLevel` enum values in frontend types | 🔴 Wrong — `"MEDIUM"`/`"CRITICAL"` should be `"MODERATE"`/`"SEVERE"` |
| SystemActions buttons | 🔴 No handler implementation |
| CameraDetailModal import | 🔴 File does not exist — runtime error on click |
| `/api/b2/*` Next.js routes | ⚠️ Dead code — bypass auth and B3 mapping |

---

*Generated: 2026-05-12 | Codebase: `services/b3-dashboard/apps/traffic-dashboard` ↔ `services/b3-dashboard/backend`*
