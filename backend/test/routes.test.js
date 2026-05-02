const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");

const createTrafficRouter = require("../src/routes/traffic");
const createHealthRouter = require("../src/routes/health");
const errorHandler = require("../src/middleware/errorHandler");

function allow(req, res, next) {
  req.user = { sub: "test-user", realm_access: { roles: ["operator"] } };
  next();
}

async function request(app, path) {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    return {
      status: response.status,
      body: await response.json(),
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("traffic routes return normalized data", async () => {
  const app = express();
  const trafficService = {
    listCameras: async () => [{ cameraId: "cam_01" }],
    getCurrentMetric: async (cameraId) => ({ cameraId }),
    getMetricHistory: async () => [],
    getCurrentCongestion: async () => [{ cameraId: "cam_01", congestionLevel: "LOW" }],
  };

  app.use("/api/traffic", createTrafficRouter({ trafficService, requireAuth: allow }));
  app.use(errorHandler);

  assert.deepEqual((await request(app, "/api/traffic/cameras")).body, [{ cameraId: "cam_01" }]);
  assert.deepEqual((await request(app, "/api/traffic/metrics/current?cameraId=cam_01")).body, {
    cameraId: "cam_01",
  });
  assert.deepEqual(
    (await request(app, "/api/traffic/metrics/history?cameraId=cam_01&from=2026-05-02T00:00:00Z&to=2026-05-02T01:00:00Z")).body,
    []
  );
  assert.deepEqual((await request(app, "/api/traffic/congestion/current")).body, [
    { cameraId: "cam_01", congestionLevel: "LOW" },
  ]);
});

test("traffic route validation returns 400", async () => {
  const app = express();
  app.use(
    "/api/traffic",
    createTrafficRouter({
      trafficService: {},
      requireAuth: allow,
    })
  );
  app.use(errorHandler);

  const response = await request(app, "/api/traffic/metrics/current");
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "bad_request");
});

test("health route includes upstream B2 status", async () => {
  const app = express();
  app.use(
    "/health",
    createHealthRouter({
      healthService: {
        getHealth: async () => ({
          status: "ok",
          service: "b3-dashboard-backend",
          upstream: { b2: { status: "ok", kafka: "ok", postgres: "ok" } },
        }),
      },
    })
  );
  app.use(errorHandler);

  const response = await request(app, "/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.upstream.b2.status, "ok");
});

test("health route reports degraded upstream without failing liveness", async () => {
  const app = express();
  app.use(
    "/health",
    createHealthRouter({
      healthService: {
        getHealth: async () => ({
          status: "degraded",
          service: "b3-dashboard-backend",
          upstream: { b2: { status: "unreachable" } },
        }),
      },
    })
  );
  app.use(errorHandler);

  const response = await request(app, "/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "degraded");
});
