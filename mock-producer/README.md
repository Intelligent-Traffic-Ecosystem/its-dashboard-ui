# Mock Producer — Dev Tooling (Not committed to git)

This folder contains two standalone Node.js scripts for local development and testing of the B3 backend.
It is listed in `.gitignore` and should **never** be pushed to the repository.

---

## Files

| File | Purpose |
|---|---|
| `mock-b2-server.js` | Simulates the B2 FastAPI service (HTTP + WebSocket on port 18000) |
| `test-b3-endpoints.js` | Automated endpoint checker — tests every B3 API route |
| `package.json` | `ws` dependency for WebSocket client in the test runner |

---

## Quick Start

```bash
# 1. Install the ws dependency (only needed for test-b3-endpoints.js WebSocket check)
cd mock-producer
npm install

# 2. In Terminal 1 — Start the mock B2 server
node mock-b2-server.js

# 3. In Terminal 2 — Ensure the B3 backend is running (DEV_BYPASS_AUTH=true)
cd backend && npm run dev

# 4. In Terminal 3 — Run the endpoint checker
cd mock-producer && node test-b3-endpoints.js
```

---

## Mock B2 Server Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{status:"ok", kafka:"ok", postgres:"ok"}` |
| GET | `/cameras` | Returns list of 4 mock cameras with coordinates |
| GET | `/congestion/current` | Returns current metrics for all cameras |
| GET | `/metrics/current?camera_id=X` | Current metric for one camera |
| GET | `/metrics/history?camera_id=X&from=T1&to=T2` | 60-point history for a camera |
| WS | `/ws/metrics` | Streams all camera metrics every 5 seconds |
| WS | `/ws/metrics?camera_id=cam_01` | (connects, receives global stream) |

---

## B3 Endpoints Tested

- `GET /`
- `GET /health`
- `GET /api/public/traffic/current`
- `GET /api/public/locations`
- `GET /api/public/map/heatmap`
- `GET /api/public/map/incidents`
- `GET /api/public/map/live`
- `GET /api/locations`
- `GET /api/traffic/cameras`
- `GET /api/traffic/congestion/current`
- `GET /api/traffic/metrics/current?camera_id=cam_01`
- `GET /api/traffic/metrics/history?camera_id=cam_01&from=…&to=…`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/events`
- `GET /api/alerts/active`
- `GET /api/alerts/history`
- `GET /api/alerts/export` (CSV)
- `GET /api/analytics/summary`
- `GET /api/analytics/trends/:cameraId`
- `GET /api/analytics/metrics`
- `GET /api/analytics/compare`
- `GET /api/map/heatmap`
- `GET /api/map/incidents`
- `GET /api/auth/me`
- `WS  /` (Socket.IO — traffic:metrics event)
- `GET /docs/` (Swagger UI)
