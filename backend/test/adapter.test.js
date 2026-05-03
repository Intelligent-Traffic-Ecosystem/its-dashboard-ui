const test = require("node:test");
const assert = require("node:assert/strict");

const { B2HttpClient } = require("../src/clients/b2HttpClient");
const { B2TrafficDataAdapter } = require("../src/adapters/b2TrafficDataAdapter");

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("B2TrafficDataAdapter maps successful REST responses", async () => {
  const httpClient = {
    get: async (path) => {
      if (path === "/cameras") return [{ camera_id: "cam_01", last_seen: new Date().toISOString() }];
      if (path === "/congestion/current") {
        return [
          {
            camera_id: "cam_01",
            window_end: new Date().toISOString(),
            vehicle_count: 3,
            congestion_level: "MEDIUM",
            congestion_score: 50,
          },
        ];
      }
      return {};
    },
  };

  const adapter = new B2TrafficDataAdapter({
    httpClient,
    websocketClient: { subscribe: () => () => {} },
  });

  const cameras = await adapter.listCameras();
  const congestion = await adapter.getCurrentCongestion();

  assert.equal(cameras[0].cameraId, "cam_01");
  assert.equal(congestion[0].cameraId, "cam_01");
  assert.equal(congestion[0].congestionLevel, "MEDIUM");
});

test("B2HttpClient surfaces upstream failures safely", async () => {
  const client = new B2HttpClient({
    baseUrl: "http://b2.local",
    timeoutMs: 1000,
    fetchImpl: async () => jsonResponse({ error: "failed" }, 500),
  });

  await assert.rejects(() => client.get("/health"), {
    code: "b2_upstream_error",
    statusCode: 503,
  });
});

test("B2HttpClient returns empty arrays from empty upstream data", async () => {
  const client = new B2HttpClient({
    baseUrl: "http://b2.local",
    timeoutMs: 1000,
    fetchImpl: async () => jsonResponse([]),
  });

  assert.deepEqual(await client.get("/cameras"), []);
});
