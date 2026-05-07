/**
 * AdminService — In-memory management of system configuration
 * Includes thresholds, zones, and camera registry.
 */

class AdminService {
    constructor() {
        // Default congestion thresholds
        this.thresholds = {
            congestion_threshold_low: 0.3,
            congestion_threshold_moderate: 0.55,
            congestion_threshold_high: 0.8,
        };

        // In-memory zone registry
        this.zones = new Map();
        this.nextZoneId = 1;

        // In-memory camera registry
        this.cameras = new Map();
        this.nextCameraId = 1;

        // Audit log (last 10000 entries)
        this.auditLog = [];
    }

    /**
     * Get current congestion thresholds
     */
    getThresholds() {
        return { ...this.thresholds };
    }

    /**
     * Update congestion thresholds
     * Validates: low < moderate < high
     */
    updateThresholds(newThresholds) {
        const { congestion_threshold_low, congestion_threshold_moderate, congestion_threshold_high } =
            newThresholds;

        if (
            typeof congestion_threshold_low !== "number" ||
            typeof congestion_threshold_moderate !== "number" ||
            typeof congestion_threshold_high !== "number"
        ) {
            throw new Error("All thresholds must be numbers");
        }

        if (
            !(
                congestion_threshold_low < congestion_threshold_moderate &&
                congestion_threshold_moderate < congestion_threshold_high
            )
        ) {
            throw new Error("Thresholds must be strictly increasing: low < moderate < high");
        }

        this.thresholds = { congestion_threshold_low, congestion_threshold_moderate, congestion_threshold_high };
        this.logAudit("THRESHOLD_UPDATE", null, { old: newThresholds, new: this.thresholds });

        return { ...this.thresholds };
    }

    /**
     * List all zones
     */
    listZones() {
        return Array.from(this.zones.values()).sort((a, b) => a.id - b.id);
    }

    /**
     * Create a new zone
     */
    createZone(data, adminUser = "admin") {
        const { name, description = "", coordinates } = data;

        if (!name || !Array.isArray(coordinates) || coordinates.length < 3) {
            throw new Error("Zone requires name and at least 3 coordinate points");
        }

        // Validate coordinates
        coordinates.forEach((coord, i) => {
            if (typeof coord.lat !== "number" || typeof coord.lon !== "number") {
                throw new Error(`Invalid coordinate at index ${i}`);
            }
            if (coord.lat < -90 || coord.lat > 90 || coord.lon < -180 || coord.lon > 180) {
                throw new Error(`Coordinate out of bounds at index ${i}`);
            }
        });

        // Auto-close polygon if not closed
        const closedCoordinates = [...coordinates];
        if (
            closedCoordinates[0].lat !== closedCoordinates[closedCoordinates.length - 1].lat ||
            closedCoordinates[0].lon !== closedCoordinates[closedCoordinates.length - 1].lon
        ) {
            closedCoordinates.push(closedCoordinates[0]);
        }

        const zone = {
            id: this.nextZoneId++,
            name,
            description,
            coordinates: closedCoordinates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        this.zones.set(zone.id, zone);
        this.logAudit("ZONE_CREATE", zone.id, zone, adminUser);

        return zone;
    }

    /**
     * Update a zone
     */
    updateZone(zoneId, data, adminUser = "admin") {
        const zone = this.zones.get(zoneId);
        if (!zone) {
            throw new Error(`Zone ${zoneId} not found`);
        }

        const updated = { ...zone };

        if (data.name) updated.name = data.name;
        if (data.description !== undefined) updated.description = data.description;
        if (Array.isArray(data.coordinates)) {
            if (data.coordinates.length < 3) {
                throw new Error("Zone requires at least 3 coordinates");
            }

            // Auto-close
            const closedCoordinates = [...data.coordinates];
            if (
                closedCoordinates[0].lat !== closedCoordinates[closedCoordinates.length - 1].lat ||
                closedCoordinates[0].lon !== closedCoordinates[closedCoordinates.length - 1].lon
            ) {
                closedCoordinates.push(closedCoordinates[0]);
            }
            updated.coordinates = closedCoordinates;
        }

        updated.updated_at = new Date().toISOString();
        this.zones.set(zoneId, updated);
        this.logAudit("ZONE_UPDATE", zoneId, updated, adminUser);

        return updated;
    }

    /**
     * Delete a zone
     */
    deleteZone(zoneId, adminUser = "admin") {
        if (!this.zones.has(zoneId)) {
            throw new Error(`Zone ${zoneId} not found`);
        }

        this.zones.delete(zoneId);
        this.logAudit("ZONE_DELETE", zoneId, null, adminUser);
    }

    /**
     * List all cameras
     */
    listCameras() {
        return Array.from(this.cameras.values()).sort((a, b) => a.id - b.id);
    }

    /**
     * Create a camera
     */
    createCamera(data, adminUser = "admin") {
        const { camera_id, name, latitude, longitude, road_segment, description } = data;

        if (!camera_id) {
            throw new Error("camera_id is required");
        }

        // Check for duplicates
        for (const cam of this.cameras.values()) {
            if (cam.camera_id === camera_id) {
                throw new Error(`Camera ${camera_id} already exists (409 Conflict)`);
            }
        }

        const camera = {
            id: this.nextCameraId++,
            camera_id,
            name: name || null,
            latitude: latitude !== undefined ? latitude : null,
            longitude: longitude !== undefined ? longitude : null,
            road_segment: road_segment || null,
            description: description || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        this.cameras.set(camera.camera_id, camera);
        this.logAudit("CAMERA_CREATE", camera.id, camera, adminUser);

        return camera;
    }

    /**
     * Update a camera (patch style)
     */
    updateCamera(cameraId, data, adminUser = "admin") {
        const camera = this.cameras.get(cameraId);
        if (!camera) {
            throw new Error(`Camera ${cameraId} not found`);
        }

        const updated = { ...camera };

        // Patch-style update: only update fields that are provided
        if (data.name !== undefined) updated.name = data.name;
        if (data.latitude !== undefined) updated.latitude = data.latitude;
        if (data.longitude !== undefined) updated.longitude = data.longitude;
        if (data.road_segment !== undefined) updated.road_segment = data.road_segment;
        if (data.description !== undefined) updated.description = data.description;

        updated.updated_at = new Date().toISOString();
        this.cameras.set(cameraId, updated);
        this.logAudit("CAMERA_UPDATE", updated.id, updated, adminUser);

        return updated;
    }

    /**
     * Delete a camera
     */
    deleteCamera(cameraId, adminUser = "admin") {
        if (!this.cameras.has(cameraId)) {
            throw new Error(`Camera ${cameraId} not found`);
        }

        const camera = this.cameras.get(cameraId);
        this.cameras.delete(cameraId);
        this.logAudit("CAMERA_DELETE", camera.id, null, adminUser);
    }

    /**
     * Validate admin token (simple check)
     * In production, this would validate against a real token store
     */
    validateAdminToken(token) {
        const validToken = process.env.ADMIN_TOKEN || "admin-token-default";
        return token === validToken;
    }

    /**
     * Log audit event
     */
    logAudit(action, entityId, data, adminUser = "admin") {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            entity_id: entityId,
            admin_user: adminUser,
            data,
        };

        this.auditLog.push(entry);

        // Keep only last 10000 entries
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }
    }

    /**
     * Get audit log
     */
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit).reverse();
    }
}

module.exports = AdminService;
