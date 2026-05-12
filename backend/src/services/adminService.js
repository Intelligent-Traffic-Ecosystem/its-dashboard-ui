const env = require("../config/env");

class AdminService {
  constructor({ httpClient }) {
    this.httpClient = httpClient;
  }

  get _h() {
    return { "X-Admin-Token": env.b2AdminToken };
  }

  // ── Thresholds ──────────────────────────────────────────────────────────────

  getThresholds() {
    return this.httpClient.get("/api/admin/thresholds", {}, this._h);
  }

  updateThresholds(data) {
    return this.httpClient.put("/api/admin/thresholds", data, this._h);
  }

  // ── Zones ────────────────────────────────────────────────────────────────────

  listZones() {
    return this.httpClient.get("/api/admin/zones", {}, this._h);
  }

  createZone(data) {
    return this.httpClient.post("/api/admin/zones", data, this._h);
  }

  updateZone(zoneId, data) {
    return this.httpClient.put(`/api/admin/zones/${zoneId}`, data, this._h);
  }

  deleteZone(zoneId) {
    return this.httpClient.delete(`/api/admin/zones/${zoneId}`, this._h);
  }

  // ── Cameras ──────────────────────────────────────────────────────────────────

  listCameras() {
    return this.httpClient.get("/api/admin/cameras", {}, this._h);
  }

  createCamera(data) {
    return this.httpClient.post("/api/admin/cameras", data, this._h);
  }

  updateCamera(cameraId, data) {
    return this.httpClient.put(
      `/api/admin/cameras/${encodeURIComponent(cameraId)}`,
      data,
      this._h
    );
  }

  deleteCamera(cameraId) {
    return this.httpClient.delete(
      `/api/admin/cameras/${encodeURIComponent(cameraId)}`,
      this._h
    );
  }

  // ── B3-side token validation (guards B3's own admin routes) ──────────────────
  validateAdminToken(token) {
    const validToken = process.env.ADMIN_TOKEN || "admin-token-default";
    return token === validToken;
  }
}

module.exports = AdminService;
