const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { mapMetricToLocation } = require("../mappers/mapFeatureMapper");

function createPublicRouter({ trafficService, mapService }) {
  const router = express.Router();

  /**
   * @openapi
   * /api/public/traffic/current:
   *   get:
   *     summary: Public live traffic metrics
   *     description: Returns current normalized traffic metrics without authentication for read-only public dashboards.
   *     tags:
   *       - Public
   */
  router.get(
    "/traffic/current",
    asyncHandler(async (req, res) => {
      const metrics = await trafficService.getCurrentCongestion();
      res.json({
        items: metrics,
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  /**
   * @openapi
   * /api/public/locations:
   *   get:
   *     summary: Public live map locations
   *     description: Returns public map pins derived from current traffic metrics without authentication.
   *     tags:
   *       - Public
   */
  router.get(
    "/locations",
    asyncHandler(async (req, res) => {
      const metrics = await trafficService.getCurrentCongestion();
      res.json({
        items: metrics.map(mapMetricToLocation),
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  /**
   * @openapi
   * /api/public/map/heatmap:
   *   get:
   *     summary: Public live heatmap points
   *     description: Returns public heatmap points without authentication.
   *     tags:
   *       - Public
   */
  router.get(
    "/map/heatmap",
    asyncHandler(async (req, res) => {
      res.json({
        items: await mapService.getHeatmap(),
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  /**
   * @openapi
   * /api/public/map/incidents:
   *   get:
   *     summary: Public live incident markers
   *     description: Returns public active incident markers without authentication.
   *     tags:
   *       - Public
   */
  router.get(
    "/map/incidents",
    asyncHandler(async (req, res) => {
      res.json({
        items: await mapService.getIncidents(),
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  /**
   * @openapi
   * /api/public/map/live:
   *   get:
   *     summary: Public live map bundle
   *     description: Returns traffic metrics, locations, heatmap points, and incident markers in one unauthenticated response.
   *     tags:
   *       - Public
   */
  router.get(
    "/map/live",
    asyncHandler(async (req, res) => {
      const metrics = await trafficService.getCurrentCongestion();
      const [heatmap, incidents] = await Promise.all([
        mapService.getHeatmap(),
        mapService.getIncidents(),
      ]);

      res.json({
        traffic: metrics,
        locations: metrics.map(mapMetricToLocation),
        heatmap,
        incidents,
        lastUpdated: new Date().toISOString(),
      });
    })
  );

  return router;
}

module.exports = createPublicRouter;
