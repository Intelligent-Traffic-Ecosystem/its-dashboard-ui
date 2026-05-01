FROM node:20-alpine AS base

# ── Build-time public env vars (baked into JS bundle) ──────────────────────
ARG NEXT_PUBLIC_ADMIN_DASHBOARD_URL
ARG NEXT_PUBLIC_TRAFFIC_DASHBOARD_URL

ENV NEXT_PUBLIC_ADMIN_DASHBOARD_URL=$NEXT_PUBLIC_ADMIN_DASHBOARD_URL
ENV NEXT_PUBLIC_TRAFFIC_DASHBOARD_URL=$NEXT_PUBLIC_TRAFFIC_DASHBOARD_URL

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Runner ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/public* ./public/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER appuser
EXPOSE 3003

# Server-only vars (KEYCLOAK_*, BACKEND_URL) are injected at runtime
# via docker-compose environment: or -e flags — no build arg needed.
CMD ["node", "server.js"]
