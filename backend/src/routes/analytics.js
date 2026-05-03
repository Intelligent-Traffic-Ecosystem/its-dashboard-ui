const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireCameraId, requireDateRange } = require("../validators/trafficQueryValidator");

function createAnalyticsRouter({ analyticsService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  /**
   * @openapi
   * /api/analytics/summary:
   *   get:
   *     summary: Get traffic analytics summary
   *     description: Returns aggregate traffic analytics and the underlying metric series for one camera over a required date-time range.
   *     tags:
   *       - Analytics
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/CameraIdQuery'
   *       - $ref: '#/components/parameters/FromQuery'
   *       - $ref: '#/components/parameters/ToQuery'
   *     responses:
   *       200:
   *         description: Analytics summary.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AnalyticsSummary'
   *       400:
   *         description: Missing or invalid query string.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: Missing or invalid session.
   */
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
