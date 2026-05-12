const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createPredictRouter({ trafficService, requireAuth }) {
  const router = express.Router();

  router.use(requireAuth);

  /**
   * @openapi
   * /api/predict/congestion:
   *   get:
   *     summary: Congestion forecast (ST-GCN model)
   *     description: Returns a short-horizon congestion prediction for a single camera using B2's ST-GCN model.
   *     tags:
   *       - Prediction
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: cameraId
   *         required: true
   *         schema:
   *           type: string
   *         description: Camera ID to forecast.
   *       - in: query
   *         name: horizonMinutes
   *         required: false
   *         schema:
   *           type: integer
   *           default: 10
   *           minimum: 1
   *           maximum: 30
   *         description: How many minutes ahead to predict.
   *       - in: query
   *         name: lookbackMinutes
   *         required: false
   *         schema:
   *           type: integer
   *           default: 15
   *           minimum: 1
   *           maximum: 120
   *         description: Historical window the model uses as input.
   *     responses:
   *       200:
   *         description: ST-GCN forecast payload.
   *       400:
   *         description: Missing or invalid cameraId.
   *       401:
   *         description: Missing or invalid session.
   *       502:
   *         description: B2 prediction service unavailable.
   */
  router.get(
    "/congestion",
    asyncHandler(async (req, res) => {
      const cameraId = req.query.cameraId || req.query.camera_id;
      if (!cameraId) {
        return res.status(400).json({ error: "cameraId is required" });
      }

      const horizonMinutes = req.query.horizonMinutes
        ? Math.min(Math.max(parseInt(req.query.horizonMinutes, 10), 1), 30)
        : undefined;
      const lookbackMinutes = req.query.lookbackMinutes
        ? Math.min(Math.max(parseInt(req.query.lookbackMinutes, 10), 1), 120)
        : undefined;

      const forecast = await trafficService.getCongestionPrediction(
        cameraId,
        horizonMinutes,
        lookbackMinutes
      );
      res.json(forecast);
    })
  );

  return router;
}

module.exports = createPredictRouter;
