# B3 — Traffic Interaction & Visualisation Platform (TIVP)
## CS3023SE · Group B · Sub-Group B3
### 5-Minute Presentation Slides

---

> **How to generate PPTX:**
> Paste this file into Claude.ai and prompt:
> *"Convert this markdown into a professional PowerPoint presentation. Use a dark tech theme (navy/slate background, blue accents). Each `---` is a new slide. Keep bullet points concise. Add relevant icons or visuals where appropriate."*
>
> Or use **Marp CLI**: `marp PRESENTATION.md --pptx -o B3_Presentation.pptx`

---

## SLIDE 1 — Title

# B3: Traffic Interaction & Visualisation Platform
### Intelligent Traffic Management System · Sub-Group B3

**CS3023SE Software Engineering**
April 2026

**Team:** Sub-Group B3 — System Engineering & Interaction

> *Visualising the city's pulse — in real time.*

---

## SLIDE 2 — Our Role in the System

# Where B3 Sits

```
B1 (Edge)        B2 (Data & Intelligence)       B3 (You are here)       B4 (Platform)
Raspberry Pi  →  Kafka + Flink + FastAPI     →   BFF + Dashboard     ←   Keycloak + Kong
Cameras          YOLO Detection                  Real-Time UI             Auth + Gateway
MQTT/OpenCV      PostgreSQL                      Socket.IO                Kubernetes/ArgoCD
```

**B3 is the only human-facing layer.**

- Receives processed traffic data from B2 via REST + WebSocket
- Authenticates users via B4's Keycloak (JWT)
- Routes all upstream calls through B4's Kong API Gateway
- Has NO direct contact with B1 edge devices

---

## SLIDE 3 — Solution Architecture

# Architecture: Backend-for-Frontend (BFF) Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React)                       │
│  Dashboard · Map · Analytics · Alerts                    │
│  Socket.IO client  ←→  REST fetch /api/*                 │
└────────────────────────┬────────────────────────────────┘
                         │ Socket.IO + HTTPS
┌────────────────────────▼────────────────────────────────┐
│              B3 BACKEND (BFF Layer)  :5000               │
│  Express.js · Socket.IO Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ REST Routes  │  │ Socket.js    │  │ Auth Routes   │  │
│  │ /api/traffic │  │ Broadcasts   │  │ Keycloak PKCE │  │
│  │ /api/alerts  │  │ traffic:*    │  │ JWT Validation│  │
│  │ /api/analytics│ │ alert:new    │  │ HttpOnly Cookie│ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────┘  │
│         │                 │                               │
│  ┌──────▼─────────────────▼──────┐                       │
│  │      B2 Adapter Layer         │                       │
│  │  B2HttpClient  B2WsClient     │                       │
│  │  (HTTP polling) (WS subscribe)│                       │
│  └──────────────┬────────────────┘                       │
└─────────────────┼───────────────────────────────────────┘
                  │ HTTP :18000 + WS
┌─────────────────▼───────────────────────────────────────┐
│                B2 FastAPI  (upstream)                    │
│   /cameras · /congestion/current · /metrics/*            │
│   ws://B2/ws/metrics  (5-second Flink windows)           │
└─────────────────────────────────────────────────────────┘
```

**Key pattern:** B2 is never exposed to the browser. B3 BFF is the single gateway.

---

## SLIDE 4 — Tech Stack

# Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16 (App Router, SSR) | SSR for fast initial load, React for reactivity |
| **Styling** | Tailwind CSS v4 | Utility-first, dark theme design system |
| **Real-Time** | Socket.IO 4 (client + server) | Bidirectional push, auto-reconnect, room support |
| **BFF Server** | Node.js 20 + Express 5 | Language consistency, Socket.IO native support |
| **B2 Client** | Native `ws` (WebSocket) + `fetch` | Lightweight, no extra dependencies |
| **Auth** | Keycloak PKCE + JWT (RS256) | Industry-standard OAuth2/OIDC |
| **Map** | Google Maps JS API (Advanced Markers) | Live camera pins with congestion colour coding |
| **API Docs** | Swagger UI + swagger-jsdoc | Auto-generated OpenAPI 3.0 at `/docs` |
| **Containerisation** | Docker + Docker Compose | Deployment parity with DOKS (B4) |
| **CI Reference** | GitHub Actions | Lint → Build → Docker push |

---

## SLIDE 5 — What We Built

# Features Implemented ✅

### Real-Time Dashboard (REQ-FR-001, 002, 003, 005)
- **KPI Summary Row** — live avg speed, congestion level (Low/Moderate/High/Critical), active incidents, alert count — auto-refreshes every 5 s via Socket.IO
- **Time-Series Line Chart** — 60-minute rolling traffic volume (SVG, no chart library needed), with 1H/6H/24H range selector
- **Live Event Feed** — 10 most recent events, 4-level severity: Informational / Warning / Critical / Emergency (REQ-FR-016)
- **Stale Data Indicator** — warns operator when feed is >30 s old (REQ-DR-004)

### Alerting (REQ-FR-015, 016, 017, 018)
- **Critical Alert Banner** — fires on `alert:new` Socket.IO event, persists until acknowledged
- **Alert Badge** — live count on notification bell in top nav
- **Severity Levels** — Informational / Warning / Critical / Emergency with distinct colour coding

### Map (REQ-FR-007, 008, 009)
- **Live Camera Pins** — fetched from B3 BFF `/api/locations` (B2 congestion → map pin conversion with real coordinates)
- **Layer Toggles** — Heatmap, CCTV Nodes, V2V Mesh (REQ-FR-011)
- **Colour-coded severity** — Green / Amber / Red / Purple per SRS standard

### Analytics Page (REQ-FR-023, 024)
- **Congestion Index Chart** — live bar per camera (congestion score)
- **Congested Segments Table** — sorted by score, real camera data
- **KPI Row** — live average congestion index + total vehicle count

### System & Auth (REQ-FR-032, 033)
- **AuthGate** — session check via `/api/auth/me` on every page load
- **Dev Bypass** — `DEV_BYPASS_AUTH=true` skips Keycloak, `/api/auth/begin` auto-redirects to dev-login
- **Connection Status** — live Socket.IO indicator (● green = live, ● yellow = reconnecting)

---

## SLIDE 6 — Real-Time Data Pipeline

# How Live Data Flows

```
B2 FastAPI (ws://localhost:18000/ws/metrics)
        │
        │  Pushes TrafficMetric[] every 5 seconds
        │  (Flink 5-second aggregation windows)
        ▼
B2WebSocketClient.js  (auto-reconnect, 3s backoff)
        │
        │  onMessage → mapB2MetricBatch()
        │  snake_case → camelCase + stale flag
        ▼
socket.js  subscribeToMetrics(callback)
        │
        ├──▶  io.emit("traffic:metrics", metrics)      → LiveEventFeed
        ├──▶  io.emit("traffic:congestion", metrics)   → KPISummaryRow, ChartPanel
        ├──▶  io.to("camera:X").emit(...)              → per-camera subscriptions
        └──▶  shouldCreateActiveAlert(metric)?
                  io.emit("alert:new", alert)          → CriticalAlertBanner, TopNavBar
        │
        ▼
Socket.IO client  (getSocket() singleton, browser)
        │
        ▼
React components  (useEffect + socket.on listeners)
```

**Data transforms applied at B3 BFF:**
- `camera_id` → `cameraId` (camelCase normalisation)
- `avg_speed_kmh` → `averageSpeedKmh`
- `stale: true` when `windowEnd` > 30 s ago
- Congestion level → alert severity (LOW=informational, MEDIUM=warning, HIGH=critical, CRITICAL=emergency)

---

## SLIDE 7 — Security & Authentication

# Security Architecture

### Authentication Flow (Keycloak PKCE)
```
User clicks Login
      ↓
GET /api/auth/begin  →  Keycloak :8080  →  User authenticates
      ↓
GET /api/auth/callback  (code exchange — client_secret stays on server)
      ↓
JWT validated → roles extracted → HttpOnly cookies set (access_token 15min, refresh_token 24h)
      ↓
Browser redirected to dashboard — JS cannot read token (XSS safe)
```

### Security Controls Implemented
| Control | Implementation |
|---|---|
| **Token storage** | HttpOnly cookies — no localStorage (REQ-NFR-010) |
| **JWT validation** | RS256 signature verify against Keycloak JWKS (10-min cache) |
| **Token refresh** | Automatic via refresh_token if access_token expired |
| **CSRF protection** | State + nonce cookies on OAuth2 flow |
| **CORS** | Explicit origin allowlist, `credentials: true` |
| **Helmet.js** | Security headers (CSP, HSTS, X-Frame-Options) |
| **Role-based routing** | `realm_access.roles` from JWT claims — operator vs admin |
| **Error responses** | No stack traces or internal details exposed (REQ-NFR-015) |
| **Dev bypass** | `DEV_BYPASS_AUTH=true` — isolated to `.env`, never in production |

---

## SLIDE 8 — Software Engineering Principles

# Engineering Principles Applied

### Requirements Engineering (IEEE 830 / IEEE 29148)
- Full SRS document v2.0 — 35 functional, 27 non-functional, 7 domain requirements
- MoSCoW prioritisation (P1 Must / P2 Should / P3 Nice-to-Have)
- Requirements Traceability Matrix (RTM) linking every FR to test type

### Design Patterns
| Pattern | Where Used |
|---|---|
| **Backend-for-Frontend (BFF)** | B3 Node.js server is sole gateway — hides B2 from browser |
| **Adapter** | `B2TrafficDataAdapter` wraps HTTP + WS clients behind a unified interface |
| **Observer / Pub-Sub** | Socket.IO rooms + event emitters for real-time fan-out |
| **Strategy** | `TrafficDataProvider` abstract base — swap B2 for mock in tests |
| **Singleton** | `getSocket()` browser-side — one Socket.IO connection per session |

### Other Principles
- **Separation of Concerns** — frontend / BFF / adapter / mapper layers fully decoupled
- **Fail-safe defaults** — degraded-mode notice + last-cached data when B2 is down (REQ-NFR-008)
- **Circuit-breaker pattern** — `B2HttpClient` wraps all upstream calls in timeout + `UpstreamError`
- **OpenAPI 3.0** — all BFF routes annotated, Swagger UI auto-generated at `/docs`
- **Environment-based config** — zero secrets in code; all via `.env` (dotenvx)

---

## SLIDE 9 — What's Next / Remaining

# Backlog & Remaining Work

### P1 — Must Complete Before Demo
| Item | SRS Ref |
|---|---|
| Analytics `/metrics/history` query wired to real date-range selector | REQ-FR-023 |
| Alert acknowledgement persisted to PostgreSQL | REQ-FR-018, REQ-DR-006 |
| Mapbox GL JS migration (SRS mandates Mapbox, currently Google Maps) | REQ-FR-007 |
| Congestion heatmap layer on map | REQ-FR-008 |

### P2 — Should Have
| Item | SRS Ref |
|---|---|
| Browser push notifications for Critical/Emergency alerts | REQ-FR-020 |
| Alert history log page with 30-day retention | REQ-FR-021 |
| Admin panel — threshold configuration UI | REQ-FR-027, 028 |
| Redis adapter for Socket.IO multi-pod scaling | REQ-NFR-026 |

### P3 — Nice to Have
| Item | SRS Ref |
|---|---|
| PDF export of analytics | REQ-FR-026 |
| Dark/light mode toggle (HttpOnly cookie preference) | REQ-FR-006 |
| i18n (next-i18next) | REQ-NFR-020 |

---

## SLIDE 10 — Summary & Demo

# Summary

### What B3 Delivers
> A production-grade real-time traffic operations dashboard connecting live camera data from B2 to operators in under 500 ms.

**Built:** Full BFF server · Socket.IO gateway · Keycloak auth · REST API with OpenAPI docs · Live dashboard · Alert system · Analytics module · Dockerised deployment

**Stack:** Next.js 16 · Node.js 20 · Express 5 · Socket.IO 4 · Tailwind CSS v4 · JWT/Keycloak · Docker

**Principles:** IEEE 830 SRS · BFF pattern · Adapter pattern · Observer/Pub-Sub · Fail-safe degraded mode · Zero-secrets-in-code

---

### Live Demo Flow
1. Start B2 stack → `docker compose up -d` (Kafka + FastAPI)
2. Start B3 backend → `npm run dev` (:5000)
3. Start B3 dashboard → `npm run dev` (:3000)
4. Navigate to `http://localhost:3000/control/dashboard`
5. Run mock producer → watch KPIs update live every 5 s
6. Trigger high congestion → see Critical Alert Banner fire

---

*Thank you — Questions?*

**Group B3 · CS3023SE Software Engineering · April 2026**
