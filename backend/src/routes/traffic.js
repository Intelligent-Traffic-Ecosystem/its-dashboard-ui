const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireCameraId, requireDateRange } = require("../validators/trafficQueryValidator");

function createTrafficRouter({ trafficService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  /**
   * @openapi
   * /api/traffic/cameras:
   *   get:
   *     summary: List traffic cameras
   *     description: Returns cameras currently known by the B2 data API, normalized for B3.
   *     tags:
   *       - Traffic
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Camera list.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Camera'
   *       401:
   *         description: Missing or invalid session.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.get(
    "/cameras",
    asyncHandler(async (req, res) => {
      res.json(await trafficService.listCameras());
    })
  );

  /**
   * @openapi
   * /api/traffic/metrics/current:
   *   get:
   *     summary: Get current camera metric
   *     description: Returns the latest normalized traffic metric for a single camera.
   *     tags:
   *       - Traffic
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/CameraIdQuery'
   *     responses:
   *       200:
   *         description: Current traffic metric.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TrafficMetric'
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
    "/metrics/current",
    asyncHandler(async (req, res) => {
      const cameraId = requireCameraId(req.query);
      res.json(await trafficService.getCurrentMetric(cameraId));
    })
  );

  /**
   * @openapi
   * /api/traffic/metrics/history:
   *   get:
   *     summary: Get historical camera metrics
   *     description: Returns normalized traffic metrics for a camera over a required date-time range.
   *     tags:
   *       - Traffic
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/CameraIdQuery'
   *       - $ref: '#/components/parameters/FromQuery'
   *       - $ref: '#/components/parameters/ToQuery'
   *     responses:
   *       200:
   *         description: Historical traffic metric series.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TrafficMetric'
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
    "/metrics/history",
    asyncHandler(async (req, res) => {
      const cameraId = requireCameraId(req.query);
      const { from, to } = requireDateRange(req.query);
      res.json(await trafficService.getMetricHistory(cameraId, from, to));
    })
  );

  /**
   * @openapi
   * /api/traffic/congestion/current:
   *   get:
   *     summary: Get current congestion
   *     description: Returns the latest normalized congestion metrics for all cameras.
   *     tags:
   *       - Traffic
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current congestion metrics.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TrafficMetric'
   *       401:
   *         description: Missing or invalid session.
   */
  router.get(
    "/congestion/current",
    asyncHandler(async (req, res) => {
      res.json(await trafficService.getCurrentCongestion());
    })
  );

  return router;
}

module.exports = createTrafficRouter;
