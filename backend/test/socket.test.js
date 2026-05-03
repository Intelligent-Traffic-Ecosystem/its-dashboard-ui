const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const createSocketServer = require("../src/socket");

class FakeIo extends EventEmitter {
  constructor() {
    super();
    this.events = [];
    this.rooms = new Map();
  }

  emit(event, payload) {
    if (event !== "connection") this.events.push({ event, payload });
    return super.emit(event, payload);
  }

  to(room) {
    return {
      emit: (event, payload) => {
        this.rooms.set(room, { event, payload });
      },
    };
  }
}

test("socket bridge emits traffic and alert events from B2 metric batches", () => {
  let onBatch;
  const io = new FakeIo();
  const bridge = createSocketServer(io, {
    trafficDataProvider: {
      subscribeToMetrics: (handler) => {
        onBatch = handler;
        return () => {};
      },
    },
  });

  onBatch([
    {
      cameraId: "cam_01",
      windowEnd: new Date().toISOString(),
      vehicleCount: 20,
      averageSpeedKmh: 12,
      queueLength: 8,
      stoppedRatio: 0.4,
      congestionLevel: "HIGH",
      congestionScore: 91,
    },
  ]);

  assert.equal(io.events.some((entry) => entry.event === "traffic:metrics"), true);
  assert.equal(io.events.some((entry) => entry.event === "traffic:congestion"), true);
  assert.equal(io.events.some((entry) => entry.event === "alert:new"), true);
  assert.equal(io.rooms.get("camera:cam_01").event, "traffic:metrics");

  bridge.unsubscribe();
});
