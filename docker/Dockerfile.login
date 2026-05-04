FROM node:22-alpine AS builder

WORKDIR /app

COPY apps/login/package*.json ./
RUN npm ci

COPY apps/login/ ./

ARG BACKEND_URL=http://localhost:5000
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003
ENV BACKEND_URL=http://localhost:5000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3003

CMD ["node", "server.js"]
