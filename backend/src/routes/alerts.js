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
      res.json(alertService.acknowledge(req.params.id, req.user));
    })
  );

  return router;
}

module.exports = createAlertsRouter;
