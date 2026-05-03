const test = require("node:test");
const assert = require("node:assert/strict");

const { requireCameraId, requireDateRange } = require("../src/validators/trafficQueryValidator");

test("requireCameraId accepts cameraId and camera_id", () => {
  assert.equal(requireCameraId({ cameraId: "cam_01" }), "cam_01");
  assert.equal(requireCameraId({ camera_id: "cam_02" }), "cam_02");
});

test("requireCameraId rejects missing camera id", () => {
  assert.throws(() => requireCameraId({}), /cameraId is required/);
});

test("requireDateRange accepts valid ISO ranges", () => {
  const range = requireDateRange({
    from: "2026-05-02T00:00:00Z",
    to: "2026-05-02T01:00:00Z",
  });

  assert.deepEqual(range, {
    from: "2026-05-02T00:00:00Z",
    to: "2026-05-02T01:00:00Z",
  });
});

test("requireDateRange rejects invalid and reversed ranges", () => {
  assert.throws(
    () => requireDateRange({ from: "not-a-date", to: "2026-05-02T01:00:00Z" }),
    /valid ISO/
  );
  assert.throws(
    () =>
      requireDateRange({
        from: "2026-05-02T02:00:00Z",
        to: "2026-05-02T01:00:00Z",
      }),
    /from must be before to/
  );
});
