const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createAlertsRouter({ alertService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  /**
   * @openapi
   * /api/alerts/active:
   *   get:
   *     summary: List active traffic alerts
   *     description: Returns active congestion alerts derived from current B2 traffic metrics.
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Active alerts.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Alert'
   *       401:
   *         description: Missing or invalid session.
   */
  router.get(
    "/active",
    asyncHandler(async (req, res) => {
      res.json(await alertService.listActiveAlerts());
    })
  );

  /**
   * @openapi
   * /api/alerts/history:
   *   get:
   *     summary: Get alert history
   *     description: Returns acknowledged alerts with pagination and filtering. Newest first.
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cameraId
   *         required: false
   *         schema:
   *           type: string
   *         description: Filter by camera ID (exact match)
   *       - in: query
   *         name: severity
   *         required: false
   *         schema:
   *           type: string
   *           enum: [WARNING, CRITICAL, EMERGENCY]
   *         description: Filter by severity
   *       - in: query
   *         name: road_segment
   *         required: false
   *         schema:
   *           type: string
   *         description: Filter by road segment (exact match)
   *       - in: query
   *         name: alert_type
   *         required: false
   *         schema:
   *           type: string
   *           enum: [congestion, stopped_traffic, incident, manual]
   *         description: Filter by alert type
   *       - in: query
   *         name: from
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *         description: ISO 8601 datetime - triggered_at >= from
   *       - in: query
   *         name: to
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *         description: ISO 8601 datetime - triggered_at <= to
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 500
   *           minimum: 1
   *           maximum: 5000
   *         description: Maximum number of alerts to return.
   *       - in: query
   *         name: offset
   *         required: false
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of alerts to skip (for pagination).
   *     responses:
   *       200:
   *         description: Alert history with pagination metadata.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Alert'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     hasMore:
   *                       type: boolean
   *       401:
   *         description: Missing or invalid session.
   */
  router.get(
    "/history",
    asyncHandler(async (req, res) => {
      const filters = {
        cameraId: req.query.cameraId || null,
        severity: req.query.severity || null,
        road_segment: req.query.road_segment || null,
        alert_type: req.query.alert_type || null,
        from: req.query.from || null,
        to: req.query.to || null,
      };
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 5000);
      const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
      res.json(await alertService.getAlertHistory({ ...filters, limit, offset }));
    })
  );

  /**
   * @openapi
   * /api/alerts/export:
   *   get:
   *     summary: Export alert history as CSV
   *     description: Returns alerts as CSV file with same filtering as /history
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: severity
   *         required: false
   *         schema:
   *           type: string
   *           enum: [WARNING, CRITICAL, EMERGENCY]
   *       - in: query
   *         name: road_segment
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: alert_type
   *         required: false
   *         schema:
   *           type: string
   *           enum: [congestion, stopped_traffic, incident, manual]
   *       - in: query
   *         name: camera_id
   *         required: false
   *         schema:
   *           type: string
   *       - in: query
   *         name: from
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: to
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 500000
   *           maximum: 500000
   *     responses:
   *       200:
   *         description: CSV file
   *         content:
   *           text/csv:
   *             schema:
   *               type: string
   *       401:
   *         description: Missing or invalid session.
   */
  router.get(
    "/export",
    asyncHandler(async (req, res) => {
      const params = {
        camera_id:    req.query.camera_id    || null,
        severity:     req.query.severity     || null,
        road_segment: req.query.road_segment || null,
        alert_type:   req.query.alert_type   || null,
        from:         req.query.from         || null,
        to:           req.query.to           || null,
      };

      // Proxy B2's CSV stream directly — real persisted data, correct headers.
      const b2Response = await alertService.streamAlertExport(params);
      const contentDisposition =
        b2Response.headers.get("content-disposition") ||
        `attachment; filename="alerts_${new Date().toISOString().slice(0, 10)}.csv"`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", contentDisposition);

      const { Readable } = require("stream");
      Readable.fromWeb(b2Response.body).pipe(res);
    })
  );

  /**
   * @openapi
   * /api/alerts/{id}/acknowledge:
   *   post:
   *     summary: Acknowledge an alert
   *     description: Marks an in-memory alert as acknowledged for the current authenticated user.
   *     tags:
   *       - Alerts
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Alert ID returned by the active alerts endpoint.
   *     responses:
   *       200:
   *         description: Acknowledged alert.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Alert'
   *       401:
   *         description: Missing or invalid session.
   *       404:
   *         description: Alert not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  router.post(
    "/:id/acknowledge",
    asyncHandler(async (req, res) => {
      res.json(await alertService.acknowledge(req.params.id, req.user));
    })
  );

  return router;
}

module.exports = createAlertsRouter;
