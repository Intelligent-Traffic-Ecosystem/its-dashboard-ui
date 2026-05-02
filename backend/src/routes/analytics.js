const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireCameraId, requireDateRange } = require("../validators/trafficQueryValidator");

function createAnalyticsRouter({ analyticsService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  router.get(
    "/summary",
    asyncHandler(async (req, res) => {
      const cameraId = requireCameraId(req.query);
      const { from, to } = requireDateRange(req.query);
      res.json(await analyticsService.getSummary(cameraId, from, to));
    })
  );

  return router;
}

module.exports = createAnalyticsRouter;
