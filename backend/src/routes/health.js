const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createHealthRouter({ healthService }) {
  const router = express.Router();

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Get backend health
   *     description: Returns B3 liveness and upstream B2 dependency health. The endpoint returns HTTP 200 even when upstream dependencies are degraded.
   *     tags:
   *       - System
   *     responses:
   *       200:
   *         description: Backend and upstream health.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   */
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const health = await healthService.getHealth();
      res.status(200).json(health);
    })
  );

  return router;
}

module.exports = createHealthRouter;
