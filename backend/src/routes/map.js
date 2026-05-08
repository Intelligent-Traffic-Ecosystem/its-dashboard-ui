const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createMapRouter({ mapService, requireAuth }) {
    const router = express.Router();

    router.use(requireAuth);

    /**
     * @openapi
     * /api/map/heatmap:
     *   get:
     *     summary: Get heatmap data for Mapbox
     *     description: Returns vehicle density points for heatmap visualization. Uses latest metrics within 5 minutes.
     *     tags:
     *       - Map
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Heatmap points
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   camera_id:
     *                     type: string
     *                   latitude:
     *                     type: number
     *                   longitude:
     *                     type: number
     *                   weight:
     *                     type: number
     *                     description: Normalized weight 0-1
     *                   vehicle_count:
     *                     type: integer
     */
    router.get(
        "/heatmap",
        asyncHandler(async (req, res) => {
            const heatmapData = await mapService.getHeatmap();
            res.json(heatmapData);
        })
    );

    /**
     * @openapi
     * /api/map/incidents:
     *   get:
     *     summary: Get active incident markers for Mapbox
     *     description: Returns active (unresolved) alerts as map markers with coordinates.
     *     tags:
     *       - Map
     *     security:
     *       - cookieAuth: []
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Incident markers
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   alert_id:
     *                     type: integer
     *                   camera_id:
     *                     type: string
     *                   latitude:
     *                     type: number
     *                     nullable: true
     *                   longitude:
     *                     type: number
     *                     nullable: true
     *                   severity:
     *                     type: string
     *                     enum: [WARNING, CRITICAL, EMERGENCY]
     *                   alert_type:
     *                     type: string
     *                   title:
     *                     type: string
     *                   triggered_at:
     *                     type: string
     *                     format: date-time
     */
    router.get(
        "/incidents",
        asyncHandler(async (req, res) => {
            const incidents = await mapService.getIncidents();
            res.json(incidents);
        })
    );

    return router;
}

module.exports = createMapRouter;
