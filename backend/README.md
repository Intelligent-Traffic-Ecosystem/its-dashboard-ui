# B3 Dashboard Backend

Node.js/Express Backend-for-Frontend (BFF) for the B3 Traffic Interaction and Visualisation Platform.

This backend authenticates users through Keycloak, adapts B2 traffic data into dashboard-friendly models, exposes REST APIs for the Next.js apps, and bridges B2 WebSocket updates to browser clients through Socket.IO.

## Architecture

```text
B2 FastAPI
  REST: /cameras, /metrics/current, /metrics/history, /congestion/current, /health
  WS:   /ws/metrics
        |
        v
B3 Adapter Layer
  TrafficDataProvider interface
  B2TrafficDataAdapter implementation
        |
        v
B3 Services
  traffic, analytics, alerts, health
        |
        v
B3 API + Socket.IO
  /api/traffic/*
  /api/analytics/*
  /api/alerts/*
  /api/locations
  Socket.IO events
        |
        v
Next.js dashboards
```

The adapter pattern keeps B2-specific REST paths, query names, and payload fields isolated in `src/adapters`, `src/clients`, and `src/mappers`. Routes and services consume normalized B3 models such as `cameraId`, `windowStart`, `vehicleCount`, `averageSpeedKmh`, `congestionLevel`, and `stale`.

## Project Structure

```text
src/
  app.js                         Express app and route mounting
  socket.js                      B2 WebSocket to Socket.IO bridge
  config/env.js                  Runtime configuration
  adapters/                      TrafficDataProvider and B2 adapter
  clients/                       B2 REST and WebSocket clients
  services/                      B3 business/application services
  routes/                        Express route modules
  mappers/                       B2-to-B3 model mapping
  middleware/                    Auth, role, and error middleware
  validators/                    Query validation
  utils/                         Shared helpers
test/                            Node test suite
```

## Local Setup

```bash
cd services/b3-dashboard/backend
npm install
cp .env.example .env
npm run dev
```

The backend starts on `http://localhost:5000` by default.

For local development without Keycloak, set:

```env
DEV_BYPASS_AUTH=true
```

Do not enable `DEV_BYPASS_AUTH` in staging or production.

## Environment Variables

| Variable | Default | Purpose |
|---|---:|---|
| `PORT` | `5000` | Express/Socket.IO server port |
| `ALLOWED_ORIGINS` | local dashboard URLs | CORS allow-list |
| `KEYCLOAK_URL` | `http://localhost:8080` | Keycloak base URL |
| `KEYCLOAK_REALM` | `its-realm` | Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | `b3-dashboard` | OAuth client ID |
| `KEYCLOAK_CLIENT_SECRET` | example value | OAuth client secret |
| `KEYCLOAK_REDIRECT_URI` | backend callback URL | OAuth callback |
| `ADMIN_DASHBOARD_URL` | `http://localhost:3001` | Admin redirect target |
| `TRAFFIC_DASHBOARD_URL` | `http://localhost:3000` | Operator redirect target |
| `LOGIN_APP_URL` | `http://localhost:3003` | Login app URL |
| `B2_API_BASE_URL` | `http://localhost:8000` | B2 FastAPI REST base URL |
| `B2_WS_URL` | `ws://localhost:8000/ws/metrics` | B2 metric WebSocket URL |
| `B2_REQUEST_TIMEOUT_MS` | `5000` | B2 REST timeout |
| `B2_WS_RECONNECT_MS` | `3000` | B2 WebSocket reconnect delay |
| `TRAFFIC_STALE_AFTER_SECONDS` | `30` | Staleness threshold for metrics |
| `DEV_BYPASS_AUTH` | `false` | Local-only auth bypass |

Inside Docker compose, `B2_API_BASE_URL` should usually be `http://host.docker.internal:8000` and `B2_WS_URL` should be `ws://host.docker.internal:8000/ws/metrics` when B2 is running separately on the host.

## REST API

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | B3 health plus upstream B2 health |
| `GET` | `/docs` | Swagger UI |

`/health` returns HTTP 200 for liveness and uses the response body to show upstream status:

```json
{
  "status": "degraded",
  "service": "b3-dashboard-backend",
  "upstream": {
    "b2": { "status": "unreachable" }
  }
}
```

### Authentication

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/begin` | Start Keycloak login |
| `GET` | `/api/auth/callback` | Keycloak OAuth callback |
| `GET` | `/api/auth/me` | Current authenticated user |
| `GET` | `/api/auth/dev-login` | Local-only dev login |
| `POST` | `/api/auth/logout` | Clear auth cookies |

### Traffic Data

All routes below require authentication unless `DEV_BYPASS_AUTH=true`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/traffic/cameras` | List cameras seen by B2 |
| `GET` | `/api/traffic/metrics/current?cameraId=cam_01` | Latest metric for one camera |
| `GET` | `/api/traffic/metrics/history?cameraId=cam_01&from=...&to=...` | Historical metrics |
| `GET` | `/api/traffic/congestion/current` | Current congestion for all cameras |
| `GET` | `/api/locations` | Map pins generated from current B2 congestion |

### Analytics And Alerts

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analytics/summary?cameraId=cam_01&from=...&to=...` | Summary statistics and metric series |
| `GET` | `/api/alerts/active` | Active alerts derived from B2 congestion |
| `POST` | `/api/alerts/:id/acknowledge` | Acknowledge an alert in memory |

Current alerts are derived until B2 provides a dedicated incident feed:

| B2 congestion | B3 severity |
|---|---|
| `LOW` | informational, not listed as active |
| `MEDIUM` | warning |
| `HIGH` | critical |
| `congestionScore >= 90` | emergency |

## Socket.IO

The backend connects to B2 `/ws/metrics` internally and re-emits normalized events to browser clients.

### Client Events

| Event | Payload | Description |
|---|---|---|
| `traffic:subscribe` | `{ "cameraId": "cam_01" }` | Join a camera-specific room |
| `traffic:unsubscribe` | `{ "cameraId": "cam_01" }` | Leave a camera-specific room |

### Server Events

| Event | Payload | Description |
|---|---|---|
| `traffic:metrics` | `TrafficMetric[]` | Live metric batch |
| `traffic:congestion` | `TrafficMetric[]` | Live congestion batch |
| `alert:new` | `Alert` | Derived warning/critical/emergency alert |

Example metric:

```json
{
  "cameraId": "cam_01",
  "windowStart": "2026-05-02T10:00:00.000Z",
  "windowEnd": "2026-05-02T10:00:05.000Z",
  "laneId": null,
  "vehicleCount": 12,
  "countsByClass": { "car": 10, "bus": 2 },
  "averageSpeedKmh": 31.5,
  "stoppedRatio": 0.2,
  "queueLength": 4,
  "congestionLevel": "HIGH",
  "congestionScore": 82.4,
  "stale": false
}
```

## Testing

```bash
npm test
```

The test suite uses Node's built-in test runner and covers:

- B2 metric and alert mappers
- query validation
- B2 adapter and HTTP client behavior
- traffic and health routes
- Socket.IO bridge event emission

## Docker

From the repository root:

```bash
docker compose up -d b3-backend b3-traffic-dashboard b3-login
```

From `services/b3-dashboard`:

```bash
docker compose up -d
```

The B3 compose file starts only the B3 services. Start B2 separately before using live traffic data, and keep it reachable from Docker at `host.docker.internal:8000` or override `COMPOSE_B2_API_BASE_URL` and `COMPOSE_B2_WS_URL`.

## Development Notes

- Keep B2 field names inside mappers and adapters only.
- Add new upstream data sources by implementing `TrafficDataProvider`; avoid changing route/service contracts.
- `/api/locations` preserves the existing frontend map-pin shape while sourcing data from B2 congestion metrics.
- Alert acknowledgement is currently in memory. PostgreSQL audit persistence should be added when the alert history/audit requirement is implemented.
