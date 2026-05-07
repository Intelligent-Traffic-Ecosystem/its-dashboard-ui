# B3 Dashboard Backend API Documentation

**Version:** 1.0.0  
**Last Updated:** May 7, 2026  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Connections to B2](#api-connections-to-b2)
4. [B3 Exposed Endpoints](#b3-exposed-endpoints)
5. [Configuration](#configuration)
6. [Development Setup](#development-setup)
7. [Real-time Features](#real-time-features)
8. [Error Handling](#error-handling)
9. [Deployment](#deployment)

---

## Overview

The **B3 Dashboard Backend** is the intermediary API layer between the **B2 Data Service** and the **B3 Frontend Applications** (Traffic Dashboard, Admin Dashboard). It provides:

- Real-time traffic metrics via HTTP and WebSocket
- Traffic analytics and historical data aggregation
- Congestion alerts and traffic monitoring
- Authentication and authorization
- Socket.IO for live client updates

**Technology Stack:**
- Framework: Express.js 5.2.1
- Real-time: Socket.IO 4.8.3
- WebSocket: ws 8.20.0
- Security: Helmet 8.1.0, CORS
- Logging: Morgan 1.10.1
- Runtime: Node.js

---

## Architecture

### High-Level Data Flow

```
B2 Backend (HTTP + WebSocket)
    ↓
B3 Backend Adapter (B2TrafficDataAdapter)
    ↓
Services Layer (TrafficService, AnalyticsService, AlertService)
    ↓
Express API Routes + Socket.IO
    ↓
B3 Frontend Applications (React)
```

### Component Structure

```
backend/
├── server.js                      # Main entry point
├── src/
│   ├── app.js                     # Express app setup
│   ├── clients/                   # B2 connectivity
│   │   ├── b2HttpClient.js        # HTTP client with timeout handling
│   │   └── b2WebSocketClient.js   # WebSocket client with auto-reconnect
│   ├── adapters/                  # Data transformation layer
│   │   ├── b2TrafficDataAdapter.js# Adapter for B2 data
│   │   └── trafficDataProvider.js # Provider interface
│   ├── services/                  # Business logic layer
│   │   ├── trafficService.js      # Traffic operations
│   │   ├── analyticsService.js    # Analytics aggregation
│   │   ├── alertService.js        # Alert management
│   │   └── healthService.js       # Health checks
│   ├── routes/                    # API endpoints
│   │   ├── traffic.js             # Traffic API
│   │   ├── analytics.js           # Analytics API
│   │   ├── alerts.js              # Alerts API
│   │   ├── auth.js                # Authentication
│   │   ├── health.js              # Health checks
│   │   └── locations.js           # Location data
│   ├── socket.js                  # Socket.IO event handling
│   ├── middleware/                # Express middleware
│   │   ├── requireAuth.js         # Authentication middleware
│   │   └── errorHandler.js        # Global error handler
│   ├── config/                    # Configuration management
│   └── validators/                # Input validation
└── package.json
```

---

## API Connections to B2

### HTTP Endpoints

All HTTP requests target the B2 API base URL (default: `http://localhost:18000`).

#### 1. Health Check
```http
GET /health
```
**Purpose:** Verify B2 service availability  
**Response:** Health status object

#### 2. List Cameras
```http
GET /cameras
```
**Purpose:** Retrieve all traffic cameras  
**Response:** Array of camera objects with ID, name, location

#### 3. Get Current Metric
```http
GET /metrics/current?camera_id={cameraId}
```
**Purpose:** Get the latest traffic metric for a specific camera  
**Parameters:**
- `camera_id` (required): Camera ID
  
**Response:** Metric object with:
- `vehicleCount`: Number of vehicles
- `congestionScore`: 0-100 score
- `averageSpeedKmh`: Average speed

#### 4. Get Metric History
```http
GET /metrics/history?camera_id={cameraId}&from={timestamp}&to={timestamp}
```
**Purpose:** Retrieve historical traffic metrics  
**Parameters:**
- `camera_id` (required): Camera ID
- `from` (required): ISO 8601 timestamp
- `to` (required): ISO 8601 timestamp
  
**Response:** Array of metric objects

#### 5. Get Current Congestion
```http
GET /congestion/current
```
**Purpose:** Get current congestion across all cameras  
**Response:** Array of metrics filtered by congestion threshold

### WebSocket Connection

**URL:** `ws://localhost:18000/ws/metrics`

**Purpose:** Receive real-time traffic metrics stream

**Connection Details:**
- Protocol: WebSocket
- Auto-reconnect: Every 3000ms on disconnect
- Message Format: JSON
- Update Frequency: Real-time as metrics arrive

**Message Format:**
```json
{
  "cameraId": "CAM-001",
  "vehicleCount": 45,
  "congestionScore": 78,
  "averageSpeedKmh": 35.5,
  "timestamp": "2026-05-07T10:30:00Z"
}
```

---

## B3 Exposed Endpoints

All endpoints require authentication (cookie or bearer token).

### Traffic API

#### List All Cameras
```http
GET /api/traffic/cameras
```
**Response:** Array of cameras with normalized schema

#### Get Current Metric
```http
GET /api/traffic/metrics/current?cameraId={cameraId}
```
**Parameters:**
- `cameraId` (required): Camera ID

**Response:**
```json
{
  "cameraId": "CAM-001",
  "vehicleCount": 45,
  "congestionScore": 78,
  "averageSpeedKmh": 35.5,
  "timestamp": "2026-05-07T10:30:00Z"
}
```

#### Get Metric History
```http
GET /api/traffic/metrics/history?cameraId={cameraId}&from={from}&to={to}
```
**Parameters:**
- `cameraId` (required): Camera ID
- `from` (required): ISO 8601 timestamp
- `to` (required): ISO 8601 timestamp

**Response:** Array of metric objects

### Analytics API

#### Get Analytics Summary
```http
GET /api/analytics/summary?cameraId={cameraId}&from={from}&to={to}
```
**Parameters:**
- `cameraId` (required): Camera ID
- `from` (required): ISO 8601 timestamp
- `to` (required): ISO 8601 timestamp

**Response:**
```json
{
  "cameraId": "CAM-001",
  "from": "2026-05-07T00:00:00Z",
  "to": "2026-05-07T23:59:59Z",
  "totalWindows": 288,
  "totalVehicles": 12450,
  "averageCongestionScore": 65.43,
  "averageSpeedKmh": 45.2,
  "peakWindow": {
    "vehicleCount": 85,
    "congestionScore": 92,
    "timestamp": "2026-05-07T17:30:00Z"
  },
  "series": [
    { "vehicleCount": 45, "congestionScore": 78, "averageSpeedKmh": 35.5 }
  ]
}
```

#### Get Traffic Trends
```http
GET /api/analytics/trends/{cameraId}?from={from}&to={to}
```
**Parameters:**
- `cameraId` (path, required): Camera ID
- `from` (query, required): ISO 8601 timestamp
- `to` (query, required): ISO 8601 timestamp

**Response:**
```json
{
  "cameraId": "CAM-001",
  "from": "2026-05-07T00:00:00Z",
  "to": "2026-05-07T23:59:59Z",
  "trend": "increasing",
  "percentageChange": 12.5,
  "speedTrend": "decreasing",
  "speedChange": -8.3,
  "peakHour": {
    "timestamp": "2026-05-07T17:30:00Z",
    "congestionScore": 95.1,
    "vehicleCount": 85,
    "averageSpeedKmh": 18.4
  },
  "lowestCongestionWindow": {
    "timestamp": "2026-05-07T02:15:00Z",
    "congestionScore": 12.3,
    "vehicleCount": 8,
    "averageSpeedKmh": 68.5
  },
  "series": [
    {
      "timestamp": "2026-05-07T00:00:00Z",
      "congestionScore": 25.4,
      "averageSpeedKmh": 62.1,
      "vehicleCount": 12
    }
  ]
}
```

**Trend Values:** `increasing` (>5% change), `decreasing` (<-5% change), `stable`, `no_data`

### Alerts API

#### List Active Alerts
```http
GET /api/alerts/active
```
**Response:** Array of active congestion alerts

**Alert Object:**
```json
{
  "id": "alert-CAM-001-1234567890",
  "cameraId": "CAM-001",
  "severity": "high",
  "message": "High traffic congestion detected",
  "vehicleCount": 85,
  "congestionScore": 92,
  "timestamp": "2026-05-07T17:30:00Z"
}
```

#### Get Alert History
```http
GET /api/alerts/history?cameraId={cameraId}&limit=100&offset=0
```
**Parameters:**
- `cameraId` (optional): Filter by camera ID
- `limit` (optional, default: 100, max: 1000): Number of results to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "items": [
    {
      "alertId": "alert-CAM-001-1234567890",
      "acknowledgedBy": "john.doe",
      "acknowledgedAt": "2026-05-07T17:35:00Z",
      "status": "acknowledged"
    }
  ],
  "pagination": {
    "total": 245,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Acknowledge Alert
```http
POST /api/alerts/{alertId}/acknowledge
```
**Parameters:**
- `alertId` (path): Alert ID

**Response:** Acknowledgement object with user info and timestamp

#### Export Alert History (CSV)
```http
GET /api/alerts/export?camera_id={cameraId}&severity={severity}&from={from}&to={to}&limit={limit}
```
**Purpose:** Download filtered alert history as a CSV file. Supports same filters as `/api/alerts/history` and larger limits for bulk export.

**Response:** `text/csv` with `Content-Disposition: attachment; filename="alerts_<YYYY-MM-DD>.csv"`

---

### Admin API (in-memory, admin token required)

All admin endpoints require an admin token via `X-Admin-Token` header (or `Authorization: Bearer <token>`). The default token is read from `ADMIN_TOKEN` environment variable. Admin actions are audited to the in-memory audit log.

#### Get/Update Thresholds
```http
GET /api/admin/thresholds
PUT /api/admin/thresholds
```
Manage congestion thresholds (`low < moderate < high`).

#### Zones CRUD
```http
GET /api/admin/zones
POST /api/admin/zones
PUT /api/admin/zones/{zoneId}
DELETE /api/admin/zones/{zoneId}
```
Create and manage polygon monitoring zones. Polygons are auto-closed if the last point differs from the first.

#### Camera Registry CRUD
```http
GET /api/admin/cameras
POST /api/admin/cameras
PUT /api/admin/cameras/{cameraId}
DELETE /api/admin/cameras/{cameraId}
```
Register cameras with latitude/longitude and `road_segment` metadata used by map endpoints and analytics.

---

### Dashboard API

#### Get Dashboard Summary
```http
GET /api/dashboard/summary
```
Returns KPIs for the dashboard: 24h incident count, average speed, overall congestion score/level, active alerts, last updated timestamp.

#### Recent Traffic Events
```http
GET /api/dashboard/events?limit=10
```
Returns recent vehicle events (camera, timestamp, vehicle_class, speed_kmh, lane_id).

---

### Map API

#### Heatmap Points
```http
GET /api/map/heatmap
```
Vehicle-density points suitable for Mapbox heatmap layer. Weight is normalized to `[0,1]` and cameras without coordinates are omitted.

#### Incident Markers
```http
GET /api/map/incidents
```
Active (unresolved) alerts returned as map markers with lat/lng from camera registry (nullable if absent).

---

### Analytics: Metrics / Compare / PDF

#### Historical Metrics
```http
GET /api/analytics/metrics?from={from}&to={to}
```
Aggregates across cameras and returns `AnalyticsMetrics` including `peak_hour_distribution`, `top_segments` (top 10 by avg congestion), and `incident_pie`.

#### Compare Two Periods
```http
GET /api/analytics/compare?aFrom={aFrom}&aTo={aTo}&bFrom={bFrom}&bTo={bTo}
```
Returns `range_a` and `range_b` analytics blocks for side-by-side comparison.

#### PDF Report
```http
GET /api/analytics/report/pdf?from={from}&to={to}
```
Generates a PDF report (uses `pdfkit`) with summary metrics, peak hour table, top segments, and incident breakdown. Returns `application/pdf` with `Content-Disposition` for download.

---

### Health API

#### Get Backend Health
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "b2Status": "ok",
  "uptime": 3600
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Backend server port |
| `B2_API_BASE_URL` | http://localhost:18000 | B2 API base URL |
| `B2_WS_URL` | ws://localhost:18000/ws/metrics | B2 WebSocket URL |
| `B2_REQUEST_TIMEOUT_MS` | 5000 | HTTP request timeout |
| `B2_WS_RECONNECT_MS` | 3000 | WebSocket reconnection interval |
| `ALLOWED_ORIGINS` | "" | CORS allowed origins (comma-separated) |
| `TRAFFIC_STALE_AFTER_SECONDS` | 30 | Metric staleness threshold |

### Example .env File

```env
PORT=5000
B2_API_BASE_URL=http://b2-backend:18000
B2_WS_URL=ws://b2-backend:18000/ws/metrics
B2_REQUEST_TIMEOUT_MS=5000
B2_WS_RECONNECT_MS=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
TRAFFIC_STALE_AFTER_SECONDS=30
```

---

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
cd services/b3-dashboard/backend
npm install
```

### Development Server

```bash
npm run dev
```

Starts development server with nodemon auto-reload on port 5000.

### Production Build

```bash
npm start
```

Runs server with Node.js directly.

### Testing

```bash
npm test
```

---

## Real-time Features

### Socket.IO Integration

B3 backend uses Socket.IO to push real-time updates to connected frontend clients.

#### Socket Events Emitted

**1. Traffic Metrics**
```javascript
io.emit("traffic:metrics", metrics)
```
Broadcasts current metrics to all connected clients.

**2. Congestion Updates**
```javascript
io.emit("traffic:congestion", metrics)
```
Broadcasts congestion data across all cameras.

**3. Camera-Specific Updates**
```javascript
io.to(`camera:${cameraId}`).emit("traffic:metrics", [metric])
```
Sends updates only to clients subscribed to a specific camera.

**4. New Alerts**
```javascript
io.emit("alert:new", alert)
```
Broadcasts newly created congestion alerts.

#### Socket Events Received

**1. Subscribe to Camera**
```javascript
socket.emit("traffic:subscribe", { cameraId: "CAM-001" })
```

**2. Unsubscribe from Camera**
```javascript
socket.emit("traffic:unsubscribe", { cameraId: "CAM-001" })
```

### WebSocket Data Flow

```
B2 Backend WebSocket
    ↓ (receives metric batch)
B3 WebSocket Client
    ↓ (parses & maps data)
B3 Traffic Data Provider
    ↓ (subscribes via trafficDataProvider.subscribeToMetrics)
Socket.IO Server
    ↓ (broadcasts to clients)
Frontend Applications
```

---

## Error Handling

### Upstream Errors (B2 Service)

When B2 service is unavailable or slow, the `UpstreamError` class provides:

```javascript
class UpstreamError extends Error {
  statusCode: number      // HTTP status (503 for service errors)
  code: string            // "b2_upstream_error"
  publicMessage: string   // User-friendly message
  cause: Error            // Original error
}
```

### Error Response Format

```json
{
  "error": {
    "message": "B2 data service is unavailable",
    "code": "b2_upstream_error",
    "statusCode": 503
  }
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Invalid query parameters |
| 401 | Missing or invalid authentication |
| 503 | B2 service unavailable |

---

## Deployment

### Docker Deployment

B3 backend includes a Dockerfile for containerized deployment:

```bash
docker build -t b3-backend:1.0.0 -f Dockerfile .
docker run -p 5000:5000 \
  -e B2_API_BASE_URL=http://b2-backend:18000 \
  -e B2_WS_URL=ws://b2-backend:18000/ws/metrics \
  b3-backend:1.0.0
```

### Docker Compose

```yaml
services:
  b3-backend:
    build:
      context: services/b3-dashboard/backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      B2_API_BASE_URL: http://b2-data:18000
      B2_WS_URL: ws://b2-data:18000/ws/metrics
    depends_on:
      - b2-data
```

---

## Version History

### v1.2.0 (2026-05-07) 🆕 Frontend Integration
- Connected traffic-dashboard frontend to `GET /api/alerts/history` endpoint
- Connected traffic-dashboard frontend to `GET /api/analytics/trends/{cameraId}` endpoint
- Created B3 backend client library (`lib/b3-backend.ts`)
- Created React hooks for API integration (`hooks/useB3Backend.ts`)
- Updated AlertHistory component with real API data
- Updated PeakHourChart component with real trend analytics
- Updated analytics page with date range filtering and camera selection
- SRS Requirements Coverage:
  - ✅ REQ-FR-021: Alert history log viewable (now persisted in B3 in-memory + B2 integration TODO)
  - ✅ REQ-FR-004: Time range switching (Last 30 Days, Last 7 Days, Quarterly)
  - ✅ REQ-FR-023: Historical analytics module for querying traffic data
  - ✅ REQ-FR-024: Peak hour distribution display with trend analysis

### v1.1.0 (2026-05-07)
- Added `GET /api/alerts/history` — Retrieve past acknowledged alerts with pagination
- Added `GET /api/analytics/trends/{cameraId}` — Historical trend analysis with peak hour detection
- Enhanced AlertService with history tracking (last 1000 entries)
- Enhanced AnalyticsService with trend calculation (percentage change, peak/lowest windows)

### v1.0.0 (2026-05-07)
- Initial release
- HTTP API with 5 endpoints
- WebSocket real-time streaming
- Socket.IO integration
- Analytics aggregation
- Alert management system
- Comprehensive error handling

---

## Support & Troubleshooting

### WebSocket Connection Issues

**Problem:** WebSocket connects but no messages arrive  
**Solution:** Check B2_WS_URL environment variable and network connectivity

### High Latency on Metrics

**Problem:** Metrics are delayed or stale  
**Solution:** Reduce B2_REQUEST_TIMEOUT_MS or check B2 service performance

### Authentication Failures

**Problem:** 401 errors on API calls  
**Solution:** Verify bearer token or cookies are included in requests

---

## Related Documentation

- [B2 Data Service API](../../b2-data/docs/)
- [Frontend Architecture](../PRESENTATION.md)
- [Docker Deployment](../DOCKER.md)
 - [services/b3-dashboard/docs/B3_API_ENDPOINTS.md](services/b3-dashboard/docs/B3_API_ENDPOINTS.md)

---

**Document Version:** 1.0.0  
**Last Modified:** May 7, 2026  
**Maintainer:** Traffic System Team
