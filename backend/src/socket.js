const { mapMetricToAlert, shouldCreateActiveAlert } = require("./mappers/alertMapper");

function createSocketServer(io, { trafficDataProvider }) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("traffic:subscribe", ({ cameraId } = {}) => {
      if (cameraId) socket.join(`camera:${cameraId}`);
    });

    socket.on("traffic:unsubscribe", ({ cameraId } = {}) => {
      if (cameraId) socket.leave(`camera:${cameraId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  const unsubscribe = trafficDataProvider.subscribeToMetrics((metrics) => {
    if (!metrics.length) return;

    io.emit("traffic:metrics", metrics);
    io.emit("traffic:congestion", metrics);

    metrics.forEach((metric) => {
      io.to(`camera:${metric.cameraId}`).emit("traffic:metrics", [metric]);

      if (shouldCreateActiveAlert(metric)) {
        io.emit("alert:new", mapMetricToAlert(metric));
      }
    });
  });

  return { unsubscribe };
}

module.exports = createSocketServer;
