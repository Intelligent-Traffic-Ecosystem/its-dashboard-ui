const { mapMetricToAlert, shouldCreateActiveAlert } = require("../mappers/alertMapper");

class AlertService {
  constructor(trafficService) {
    this.trafficService = trafficService;
    this.acknowledged = new Map(); // Map<alertId, acknowledgement>
    this.history = []; // Array of all alerts with acknowledgement history
  }

  async listActiveAlerts() {
    const metrics = await this.trafficService.getCurrentCongestion();
    return metrics
      .filter(shouldCreateActiveAlert)
      .map(mapMetricToAlert)
      .filter((alert) => !this.acknowledged.has(alert.id));
  }

  acknowledge(alertId, user) {
    const acknowledgement = {
      alertId,
      acknowledgedBy: user?.preferred_username || user?.sub || "unknown",
      acknowledgedAt: new Date().toISOString(),
    };
    this.acknowledged.set(alertId, acknowledgement);

    // Add to history
    const historyEntry = {
      ...acknowledgement,
      status: "acknowledged",
    };
    this.history.push(historyEntry);

    // Keep only last 1000 entries in memory
    if (this.history.length > 1000) {
      this.history.shift();
    }

    return acknowledgement;
  }

  async getAlertHistory(options = {}) {
    const { cameraId = null, limit = 100, offset = 0, status = "acknowledged" } = options;

    let filtered = this.history.slice();

    // Filter by camera if specified
    if (cameraId) {
      filtered = filtered.filter((entry) => entry.alertId?.includes(cameraId));
    }

    // Filter by status if needed
    if (status) {
      filtered = filtered.filter((entry) => entry.status === status);
    }

    // Apply pagination
    const total = filtered.length;
    const items = filtered
      .sort((a, b) => new Date(b.acknowledgedAt) - new Date(a.acknowledgedAt))
      .slice(offset, offset + limit);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
}

module.exports = AlertService;
