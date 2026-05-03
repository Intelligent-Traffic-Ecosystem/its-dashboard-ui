const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { mapMetricToLocation } = require("../mappers/mapFeatureMapper");
const { trafficService } = require("../services");

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Get all map pin locations
 *     description: Returns incidents, sensors, CCTV nodes, and construction zones for the live map.
 *     tags:
 *       - Locations
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of location pins
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Location'
 *       401:
 *         description: Missing or invalid session.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const metrics = await trafficService.getCurrentCongestion();
    res.json(metrics.map(mapMetricToLocation));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
