const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireCameraId, requireDateRange } = require("../validators/trafficQueryValidator");

function createTrafficRouter({ trafficService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  router.get(
    "/cameras",
    asyncHandler(async (req, res) => {
      res.json(await trafficService.listCameras());
    })
  );

  router.get(
    "/metrics/current",
    asyncHandler(async (req, res) => {
      const cameraId = requireCameraId(req.query);
      res.json(await trafficService.getCurrentMetric(cameraId));
    })
  );

  router.get(
    "/metrics/history",
    asyncHandler(async (req, res) => {
      const cameraId = requireCameraId(req.query);
      const { from, to } = requireDateRange(req.query);
      res.json(await trafficService.getMetricHistory(cameraId, from, to));
    })
  );

  router.get(
    "/congestion/current",
    asyncHandler(async (req, res) => {
      res.json(await trafficService.getCurrentCongestion());
    })
  );

  return router;
}

module.exports = createTrafficRouter;
