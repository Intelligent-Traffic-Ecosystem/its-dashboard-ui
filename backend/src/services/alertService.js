const { B2AlertAdapter } = require("../adapters/b2AlertAdapter");

class AlertService {
  /**
   * @param {B2AlertAdapter} b2AlertAdapter
   */
  constructor(b2AlertAdapter) {
    this.b2AlertAdapter = b2AlertAdapter;
  }

  /** Returns active (unacknowledged) alerts from B2 database. */
  async listActiveAlerts() {
    return this.b2AlertAdapter.listActiveAlerts();
  }

  /**
   * Acknowledges an alert in B2 and returns the acknowledgement record.
   * @param {string} alertId - numeric B2 alert ID (as string)
   * @param {object} user    - authenticated user from req.user
   */
  async acknowledge(alertId, user) {
    const userId = user?.preferred_username || user?.sub || user?.name || "operator";
    return this.b2AlertAdapter.acknowledgeAlert(alertId, userId);
  }

  /**
   * Returns paginated acknowledged alert history from B2 database.
   * @param {object} options - {cameraId, severity, from, to, limit, offset}
   */
  async getAlertHistory(options = {}) {
    return this.b2AlertAdapter.getAlertHistory(options);
  }

  /** Streams the B2 CSV export directly (passes through raw fetch Response). */
  streamAlertExport(params = {}) {
    return this.b2AlertAdapter.streamAlertExport(params);
  }
}

module.exports = AlertService;
