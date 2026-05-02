const { mapMetricToAlert, shouldCreateActiveAlert } = require("../mappers/alertMapper");

class AlertService {
  constructor(trafficService) {
    this.trafficService = trafficService;
    this.acknowledged = new Map();
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
    return acknowledgement;
  }
}

module.exports = AlertService;
