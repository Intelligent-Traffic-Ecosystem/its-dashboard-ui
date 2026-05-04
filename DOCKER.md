# B3 Dashboard Docker Image Guide

DevOps should build and deploy separate Docker images for the B3 dashboard module. Docker Compose is not required for deployment.

| Component | Dockerfile | Default image | Port |
| --- | --- | --- | --- |
| Backend API | `docker/Dockerfile.backend` | `its-b3-backend:latest` | `5000` |
| Traffic dashboard | `docker/Dockerfile.traffic-dashboard` | `its-b3-traffic-dashboard:latest` | `3000` |
| Login app | `docker/Dockerfile.login` | `its-b3-login:latest` | `3003` |
| Public app | `docker/Dockerfile.public-app` | `its-b3-public-app:latest` | `3002` |

Run all commands from `services/b3-dashboard`.

## Build Images

Backend image:

```bash
docker build -f docker/Dockerfile.backend -t its-b3-backend:latest .
```

Traffic dashboard image:

```bash
docker build \
  -f docker/Dockerfile.traffic-dashboard \
  --build-arg NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 \
  --build-arg NEXT_PUBLIC_LOGIN_APP_URL=http://localhost:3003 \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_ID= \
  -t its-b3-traffic-dashboard:latest .
```

Login image:

```bash
docker build \
  -f docker/Dockerfile.login \
  --build-arg BACKEND_URL=http://localhost:5000 \
  -t its-b3-login:latest .
```

Public app image (Mapbox token is required for the map; it is inlined at build time):

```bash
docker build \
  -f docker/Dockerfile.public-app \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token \
  -t its-b3-public-app:latest .
```

## Runtime Environment

Do not bake backend secrets into the Dockerfile. Pass them when the container runs through the deployment platform, for example Kubernetes `env`, ECS task environment, Docker `--env-file`, or CI/CD secrets.

Backend runtime variables:

```text
PORT=5000
NODE_ENV=production
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=its-realm
KEYCLOAK_CLIENT_ID=b3-dashboard
KEYCLOAK_CLIENT_SECRET=change-me
KEYCLOAK_REDIRECT_URI=http://localhost:5000/api/auth/callback
ADMIN_DASHBOARD_URL=http://localhost:3001
TRAFFIC_DASHBOARD_URL=http://localhost:3000
LOGIN_APP_URL=http://localhost:3003
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3003
SWAGGER_SERVER_URL=http://localhost:5000
```

Traffic dashboard build variables:

```text
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_LOGIN_APP_URL=http://localhost:3003
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_ID=
```

Login runtime variable:

```text
BACKEND_URL=http://localhost:5000
```

Important:

- Backend variables are runtime variables.
- Login `BACKEND_URL` is runtime and must be reachable by the user's browser because the login app redirects the browser there.
- Traffic dashboard `NEXT_PUBLIC_*` values are build-time variables because Next.js bundles them into frontend JavaScript. Rebuild the traffic dashboard image after changing them.

## Run Images With Docker

Backend:

```bash
docker run --rm -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e KEYCLOAK_URL=http://localhost:8080 \
  -e KEYCLOAK_REALM=its-realm \
  -e KEYCLOAK_CLIENT_ID=b3-dashboard \
  -e KEYCLOAK_CLIENT_SECRET=change-me \
  -e KEYCLOAK_REDIRECT_URI=http://localhost:5000/api/auth/callback \
  -e ADMIN_DASHBOARD_URL=http://localhost:3001 \
  -e TRAFFIC_DASHBOARD_URL=http://localhost:3000 \
  -e LOGIN_APP_URL=http://localhost:3003 \
  -e ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3003 \
  -e SWAGGER_SERVER_URL=http://localhost:5000 \
  its-b3-backend:latest
```

Traffic dashboard:

```bash
docker run --rm -p 3000:3000 its-b3-traffic-dashboard:latest
```

Login app:

```bash
docker run --rm -p 3003:3003 \
  -e BACKEND_URL=http://localhost:5000 \
  its-b3-login:latest
```

Public app:

```bash
docker run --rm -p 3002:3002 its-b3-public-app:latest
```

## Push Images

Tag images for the target registry:

```bash
docker tag its-b3-backend:latest registry.example.com/its-b3-backend:1.0.0
docker tag its-b3-traffic-dashboard:latest registry.example.com/its-b3-traffic-dashboard:1.0.0
docker tag its-b3-login:latest registry.example.com/its-b3-login:1.0.0
docker tag its-b3-public-app:latest registry.example.com/its-b3-public-app:1.0.0
```

Push images:

```bash
docker push registry.example.com/its-b3-backend:1.0.0
docker push registry.example.com/its-b3-traffic-dashboard:1.0.0
docker push registry.example.com/its-b3-login:1.0.0
docker push registry.example.com/its-b3-public-app:1.0.0
```

## Optional Local Compose

`docker-compose.yml` is only a local convenience file for developers who want to run all three containers together. DevOps can ignore it if images are deployed separately.

```bash
cp .env.example .env
docker compose --env-file .env up --build
```
