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

  /**
   * @openapi
   * /api/analytics/trends/{cameraId}:
   *   get:
   *     summary: Get traffic trends and historical analysis
   *     description: Returns congestion and speed trends for a camera over a date-time range. Identifies peak hours and trend direction (increasing, decreasing, stable).
   *     tags:
   *       - Analytics
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cameraId
   *         required: true
   *         schema:
   *           type: string
   *         description: Camera ID to analyze.
   *       - $ref: '#/components/parameters/FromQuery'
   *       - $ref: '#/components/parameters/ToQuery'
   *     responses:
   *       200:
   *         description: Traffic trends and analysis.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 cameraId:
   *                   type: string
   *                 from:
   *                   type: string
   *                 to:
   *                   type: string
   *                 trend:
   *                   type: string
   *                   enum: [increasing, decreasing, stable, no_data]
   *                   description: Overall congestion trend direction
   *                 percentageChange:
   *                   type: number
   *                   description: Percentage change from first to second half of period
   *                 speedTrend:
   *                   type: string
   *                   enum: [increasing, decreasing, stable, no_data]
   *                 speedChange:
   *                   type: number
   *                 peakHour:
   *                   type: object
   *                   description: Highest congestion window
   *                 lowestCongestionWindow:
   *                   type: object
   *                   description: Lowest congestion window
   *                 series:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       timestamp:
   *                         type: string
   *                       congestionScore:
   *                         type: number
   *                       averageSpeedKmh:
   *                         type: number
   *                       vehicleCount:
   *                         type: integer
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
    "/trends/:cameraId",
    asyncHandler(async (req, res) => {
      const cameraId = req.params.cameraId;
      if (!cameraId || cameraId.trim() === "") {
        return res.status(400).json({ error: "cameraId path parameter is required" });
      }
      const { from, to } = requireDateRange(req.query);
      res.json(await analyticsService.getTrends(cameraId, from, to));
    })
  );

  /**
   * @openapi
   * /api/analytics/metrics:
   *   get:
   *     summary: Get historical analytics metrics
   *     description: Returns aggregated metrics for a date range including peak hour distribution, top segments, and incident breakdown.
   *     tags:
   *       - Analytics
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/FromQuery'
   *       - $ref: '#/components/parameters/ToQuery'
   *     responses:
   *       200:
   *         description: Analytics metrics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 range_start:
   *                   type: string
   *                   format: date-time
   *                 range_end:
   *                   type: string
   *                   format: date-time
   *                 avg_congestion_score:
   *                   type: number
   *                 peak_hour_distribution:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       hour:
   *                         type: integer
   *                       avg_vehicle_count:
   *                         type: number
   *                       avg_congestion_score:
   *                         type: number
   *                 top_segments:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       camera_id:
   *                         type: string
   *                       road_segment:
   *                         type: string
   *                         nullable: true
   *                       avg_congestion_score:
   *                         type: number
   *                       severe_minutes:
   *                         type: number
   *                 incident_pie:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       severity:
   *                         type: string
   *                       count:
   *                         type: integer
   */
  router.get(
    "/metrics",
    asyncHandler(async (req, res) => {
      const { from, to } = requireDateRange(req.query);
      res.json(await analyticsService.getMetrics(from, to));
    })
  );

  /**
   * @openapi
   * /api/analytics/compare:
   *   get:
   *     summary: Compare two time periods side-by-side
   *     description: Returns analytics metrics for two date ranges for comparison analysis.
   *     tags:
   *       - Analytics
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: aFrom
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start of first period (ISO 8601)
   *       - in: query
   *         name: aTo
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End of first period (ISO 8601)
   *       - in: query
   *         name: bFrom
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start of second period (ISO 8601)
   *       - in: query
   *         name: bTo
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End of second period (ISO 8601)
   *     responses:
   *       200:
   *         description: Comparison metrics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 range_a:
   *                   type: object
   *                   description: Analytics metrics for first period
   *                 range_b:
   *                   type: object
   *                   description: Analytics metrics for second period
   */
  router.get(
    "/compare",
    asyncHandler(async (req, res) => {
      const aFrom = req.query.aFrom;
      const aTo = req.query.aTo;
      const bFrom = req.query.bFrom;
      const bTo = req.query.bTo;

      if (!aFrom || !aTo || !bFrom || !bTo) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Requires query params: aFrom, aTo, bFrom, bTo (all ISO 8601)",
        });
      }

      const metricsA = await analyticsService.getMetrics(aFrom, aTo);
      const metricsB = await analyticsService.getMetrics(bFrom, bTo);

      res.json({ range_a: metricsA, range_b: metricsB });
    })
  );

  /**
   * @openapi
   * /api/analytics/report/pdf:
   *   get:
   *     summary: Export analytics report as PDF
   *     description: Returns PDF with analytics metrics, tables, and charts for a date range.
   *     tags:
   *       - Analytics
   *     security:
   *       - cookieAuth: []
   *       - bearerAuth: []
   *     parameters:
   *       - $ref: '#/components/parameters/FromQuery'
   *       - $ref: '#/components/parameters/ToQuery'
   *     responses:
   *       200:
   *         description: PDF file
   *         content:
   *           application/pdf:
   *             schema:
   *               type: string
   *               format: binary
   */
  router.get(
    "/report/pdf",
    asyncHandler(async (req, res) => {
      const { from, to } = requireDateRange(req.query);
      const metrics = await analyticsService.getMetrics(from, to);

      // Generate PDF using PDFKit
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="its_analytics_${from.slice(0, 10)}_${to.slice(0, 10)}.pdf"`
      );

      doc.pipe(res);

      // Title
      doc.fontSize(20).font("Helvetica-Bold").text("Traffic Analytics Report", { align: "center" });
      doc.fontSize(10).font("Helvetica").text(`Period: ${from} to ${to}`, { align: "center" });
      doc.moveDown();

      // Summary section
      doc.fontSize(14).font("Helvetica-Bold").text("Summary Metrics", { underline: true });
      doc.fontSize(10).font("Helvetica");
      doc.text(`Average Congestion Score: ${metrics.avg_congestion_score.toFixed(2)}`);
      doc.moveDown(0.5);

      // Peak hour distribution table
      doc.fontSize(14).font("Helvetica-Bold").text("Peak Hour Distribution", { underline: true });
      doc.fontSize(9).font("Helvetica");
      doc.text("Hour | Avg Vehicles | Avg Congestion");
      metrics.peak_hour_distribution.forEach((hour) => {
        doc.text(`${hour.hour.toString().padStart(2, "0")}:00 | ${hour.avg_vehicle_count.toFixed(1)} | ${(hour.avg_congestion_score * 100).toFixed(1)}%`);
      });
      doc.moveDown();

      // Top segments table
      doc.fontSize(14).font("Helvetica-Bold").text("Top Congested Segments", { underline: true });
      doc.fontSize(9).font("Helvetica");
      doc.text("Camera | Road Segment | Avg Congestion | Severe Minutes");
      metrics.top_segments.forEach((seg) => {
        const roadSeg = seg.road_segment || "N/A";
        doc.text(
          `${seg.camera_id} | ${roadSeg} | ${(seg.avg_congestion_score * 100).toFixed(1)}% | ${seg.severe_minutes.toFixed(1)}`
        );
      });
      doc.moveDown();

      // Incident breakdown
      doc.fontSize(14).font("Helvetica-Bold").text("Incidents by Severity", { underline: true });
      doc.fontSize(9).font("Helvetica");
      metrics.incident_pie.forEach((incident) => {
        doc.text(`${incident.severity}: ${incident.count} incidents`);
      });

      doc.end();
    })
  );

  return router;
}

module.exports = createAnalyticsRouter;
