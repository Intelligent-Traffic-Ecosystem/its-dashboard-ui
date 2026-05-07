const express = require("express");
const asyncHandler = require("../utils/asyncHandler");

function createAdminRouter({ adminService, requireAuth }) {
    const router = express.Router();

    /**
     * Middleware to validate admin token
     * Extracts from X-Admin-Token header or Authorization: Bearer <token>
     */
    const requireAdminToken = (req, res, next) => {
        const adminToken = req.headers["x-admin-token"] || req.headers.authorization?.replace("Bearer ", "");
        const adminUser = req.headers["x-admin-user"] || "admin";

        if (!adminToken || !adminService.validateAdminToken(adminToken)) {
            return res.status(401).json({ error: "Unauthorized", message: "Invalid or missing admin token" });
        }

        req.adminUser = adminUser;
        next();
    };

    // All admin routes require auth
    router.use(requireAuth);
    router.use(requireAdminToken);

    /**
     * @openapi
     * /api/admin/thresholds:
     *   get:
     *     summary: Get congestion thresholds
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     responses:
     *       200:
     *         description: Current thresholds
     */
    router.get(
        "/thresholds",
        asyncHandler(async (req, res) => {
            res.json(adminService.getThresholds());
        })
    );

    /**
     * @openapi
     * /api/admin/thresholds:
     *   put:
     *     summary: Update congestion thresholds
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               congestion_threshold_low:
     *                 type: number
     *               congestion_threshold_moderate:
     *                 type: number
     *               congestion_threshold_high:
     *                 type: number
     *     responses:
     *       200:
     *         description: Updated thresholds
     */
    router.put(
        "/thresholds",
        asyncHandler(async (req, res) => {
            const updated = adminService.updateThresholds(req.body);
            res.json(updated);
        })
    );

    /**
     * @openapi
     * /api/admin/zones:
     *   get:
     *     summary: List all monitoring zones
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     responses:
     *       200:
     *         description: Array of zones
     */
    router.get(
        "/zones",
        asyncHandler(async (req, res) => {
            res.json(adminService.listZones());
        })
    );

    /**
     * @openapi
     * /api/admin/zones:
     *   post:
     *     summary: Create a monitoring zone
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               coordinates:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     lat:
     *                       type: number
     *                     lon:
     *                       type: number
     *     responses:
     *       201:
     *         description: Created zone
     */
    router.post(
        "/zones",
        asyncHandler(async (req, res) => {
            const zone = adminService.createZone(req.body, req.adminUser);
            res.status(201).json(zone);
        })
    );

    /**
     * @openapi
     * /api/admin/zones/{zoneId}:
     *   put:
     *     summary: Update a zone
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     parameters:
     *       - in: path
     *         name: zoneId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Updated zone
     */
    router.put(
        "/zones/:zoneId",
        asyncHandler(async (req, res) => {
            const zoneId = parseInt(req.params.zoneId);
            const updated = adminService.updateZone(zoneId, req.body, req.adminUser);
            res.json(updated);
        })
    );

    /**
     * @openapi
     * /api/admin/zones/{zoneId}:
     *   delete:
     *     summary: Delete a zone
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     parameters:
     *       - in: path
     *         name: zoneId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       204:
     *         description: Zone deleted
     */
    router.delete(
        "/zones/:zoneId",
        asyncHandler(async (req, res) => {
            const zoneId = parseInt(req.params.zoneId);
            adminService.deleteZone(zoneId, req.adminUser);
            res.status(204).send();
        })
    );

    /**
     * @openapi
     * /api/admin/cameras:
     *   get:
     *     summary: List all cameras
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     responses:
     *       200:
     *         description: Array of cameras
     */
    router.get(
        "/cameras",
        asyncHandler(async (req, res) => {
            res.json(adminService.listCameras());
        })
    );

    /**
     * @openapi
     * /api/admin/cameras:
     *   post:
     *     summary: Create a camera
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               camera_id:
     *                 type: string
     *               name:
     *                 type: string
     *               latitude:
     *                 type: number
     *               longitude:
     *                 type: number
     *               road_segment:
     *                 type: string
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Created camera
     *       409:
     *         description: Camera already exists
     */
    router.post(
        "/cameras",
        asyncHandler(async (req, res) => {
            const camera = adminService.createCamera(req.body, req.adminUser);
            res.status(201).json(camera);
        })
    );

    /**
     * @openapi
     * /api/admin/cameras/{cameraId}:
     *   put:
     *     summary: Update a camera
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     parameters:
     *       - in: path
     *         name: cameraId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Updated camera
     */
    router.put(
        "/cameras/:cameraId",
        asyncHandler(async (req, res) => {
            const updated = adminService.updateCamera(req.params.cameraId, req.body, req.adminUser);
            res.json(updated);
        })
    );

    /**
     * @openapi
     * /api/admin/cameras/{cameraId}:
     *   delete:
     *     summary: Delete a camera
     *     tags:
     *       - Admin
     *     security:
     *       - adminToken: []
     *     parameters:
     *       - in: path
     *         name: cameraId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Camera deleted
     */
    router.delete(
        "/cameras/:cameraId",
        asyncHandler(async (req, res) => {
            adminService.deleteCamera(req.params.cameraId, req.adminUser);
            res.status(204).send();
        })
    );

    return router;
}

module.exports = createAdminRouter;
