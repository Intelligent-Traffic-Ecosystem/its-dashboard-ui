const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createDashboardRouter({ dashboardService, requireAuth }) {
    const router = express.Router();

    router.use(requireAuth);

    /**
     * @openapi
     * /api/dashboard/summary:
     *   get:
     *     summary: Get dashboard summary
     *     description: Returns current traffic summary including incidents, speed, congestion, and alert count.
     *     tags:
     *       - Dashboard
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard summary
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 total_incidents_24h:
     *                   type: integer
     *                 avg_speed_kmh:
     *                   type: number
     *                 overall_congestion_level:
     *                   type: string
     *                   enum: [LOW, MODERATE, HIGH, SEVERE]
     *                 overall_congestion_score:
     *                   type: number
     *                 active_alerts:
     *                   type: integer
     *                 last_updated:
     *                   type: string
     *                   format: date-time
     */
    router.get(
        "/summary",
        asyncHandler(async (req, res) => {
            const summary = await dashboardService.getSummary();
            res.json(summary);
        })
    );

    /**
     * @openapi
     * /api/dashboard/events:
     *   get:
     *     summary: Get recent traffic events
     *     description: Returns most recent traffic events (vehicles detected, speed, etc).
     *     tags:
     *       - Dashboard
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: limit
     *         required: false
     *         schema:
     *           type: integer
     *           default: 10
     *           minimum: 1
     *           maximum: 100
     *         description: Maximum number of events to return
     *     responses:
     *       200:
     *         description: Recent events
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   camera_id:
     *                     type: string
     *                   timestamp:
     *                     type: string
     *                     format: date-time
     *                   vehicle_class:
     *                     type: string
     *                   speed_kmh:
     *                     type: number
     *                   lane_id:
     *                     type: integer
     *                     nullable: true
     */
    router.get(
        "/events",
        asyncHandler(async (req, res) => {
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
            const events = await dashboardService.getRecentEvents(limit);
            res.json(events);
        })
    );

    return router;
}

module.exports = createDashboardRouter;
