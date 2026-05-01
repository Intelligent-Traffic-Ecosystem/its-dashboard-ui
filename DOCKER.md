# Docker Guide — B3 Dashboard

## Services

| Service | Port | Description |
|---|---|---|
| `backend` | `5000` | Express API + Socket.IO |
| `login` | `3003` | Next.js login app (Keycloak OIDC) |
| `traffic-dashboard` | `3000` | Next.js traffic operator dashboard |

---

## Quick Start

```bash
# 1. Copy env file and fill in your values
cp .env.example .env

# 2. Build and start all services
docker compose up --build

# 3. Open in browser
#    Login:             http://localhost:3003
#    Traffic Dashboard: http://localhost:3000
#    Backend API:       http://localhost:5000
#    API Docs:          http://localhost:5000/docs
```

---

## Environment Variables

All variables live in a single `.env` file next to `docker-compose.yml`.

### How they flow

```
.env
 ├── build args  →  NEXT_PUBLIC_* vars  →  baked into JS bundle at docker build
 └── environment →  server-only vars    →  injected at container start
```

> **Rule:** `NEXT_PUBLIC_*` vars are read by the browser — they must be set at
> **build time**. Changing them requires `docker compose up --build`.
> All other vars are server-side and only need a restart to take effect.

### Variable reference

| Variable | Used by | When | Description |
|---|---|---|---|
| `KEYCLOAK_URL` | backend, login | runtime | Keycloak server URL |
| `KEYCLOAK_REALM` | backend, login | runtime | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | backend, login | runtime | OAuth client ID |
| `KEYCLOAK_CLIENT_SECRET` | backend | runtime | OAuth client secret (never in frontend) |
| `KEYCLOAK_REDIRECT_URI` | backend | runtime | Must match Keycloak client config |
| `ADMIN_DASHBOARD_URL` | backend, login | build + runtime | Public URL of admin dashboard |
| `TRAFFIC_DASHBOARD_URL` | backend, login | build + runtime | Public URL of traffic dashboard |
| `LOGIN_APP_URL` | backend | runtime | Public URL of login app |
| `BACKEND_INTERNAL_URL` | login | runtime | Backend URL inside Docker network |
| `BACKEND_PUBLIC_URL` | traffic-dashboard | **build time** | Backend URL reachable from browser |
| `ALLOWED_ORIGINS` | backend | runtime | Comma-separated CORS origins |
| `GOOGLE_MAPS_API_KEY` | traffic-dashboard | **build time** | Google Maps JS API key |
| `GOOGLE_MAPS_ID` | traffic-dashboard | **build time** | Google Maps Map ID |
| `DEV_BYPASS_AUTH` | backend | runtime | `true` skips Keycloak (dev only) |

---

## Common Commands

```bash
# Start all services (rebuild if Dockerfiles or source changed)
docker compose up --build

# Start without rebuilding
docker compose up

# Start a single service
docker compose up --build traffic-dashboard

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f traffic-dashboard

# Rebuild one service only
docker compose build traffic-dashboard
docker compose up -d traffic-dashboard

# Open a shell inside a running container
docker compose exec backend sh
docker compose exec traffic-dashboard sh
```

---

## Changing Environment Variables

### Server-only vars (runtime)
Edit `.env`, then restart the affected service:
```bash
docker compose restart backend
```

### `NEXT_PUBLIC_*` vars (build time)
Edit `.env`, then rebuild and redeploy:
```bash
docker compose up --build traffic-dashboard
docker compose up --build login
```

---

## Dev Without Keycloak

Set `DEV_BYPASS_AUTH=true` in `.env` and navigate directly to:
```
http://localhost:5000/api/auth/dev-login
```
The backend sets a mock session cookie and redirects to the traffic dashboard.

> Never set `DEV_BYPASS_AUTH=true` in production.

---

## Two Backend URL Variables

The login container and the browser both call the backend, but from different network contexts:

```
┌─────────────────────────────────────────────────────┐
│ Docker network                                      │
│                                                     │
│  login ──── BACKEND_INTERNAL_URL ────► backend:5000 │
└─────────────────────────────────────────────────────┘

Browser ──── BACKEND_PUBLIC_URL ────► localhost:5000
```

| Variable | Value | Used from |
|---|---|---|
| `BACKEND_INTERNAL_URL` | `http://backend:5000` | Inside Docker (service name) |
| `BACKEND_PUBLIC_URL` | `http://localhost:5000` | Browser (baked into JS bundle) |

---

## Production Checklist

- [ ] `DEV_BYPASS_AUTH=false`
- [ ] `KEYCLOAK_CLIENT_SECRET` set to real secret
- [ ] `GOOGLE_MAPS_API_KEY` restricted to your domain in Google Cloud Console
- [ ] `ALLOWED_ORIGINS` lists only your actual frontend domains
- [ ] `BACKEND_PUBLIC_URL` points to your real backend domain (not localhost)
- [ ] All `*_URL` vars use `https://`
- [ ] `KEYCLOAK_REDIRECT_URI` registered in Keycloak client settings
