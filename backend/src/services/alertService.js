const { mapMetricToAlert, shouldCreateActiveAlert } = require("../mappers/alertMapper");

class AlertService {
  constructor(trafficService) {
    this.trafficService = trafficService;
    // In-memory acknowledgement store for synthetic B3 active alerts
    // (metric-derived IDs that have no corresponding B2 AlertRecord row).
    this._acknowledged = new Map();
  }

  // Active alerts are derived in real-time from current congestion metrics.
  // B2 has no "list active alerts" REST endpoint, so this stays local.
  async listActiveAlerts() {
    const metrics = await this.trafficService.getCurrentCongestion();
    return metrics
      .filter(shouldCreateActiveAlert)
      .map(mapMetricToAlert)
      .filter((alert) => !this._acknowledged.has(alert.id));
  }

  // Alert history comes from B2's persisted AlertRecord table.
  // B2 returns a flat list; pagination is applied here in B3.
  async getAlertHistory(options = {}) {
    const {
      cameraId  = null,
      severity  = null,
      road_segment = null,
      alert_type   = null,
      from  = null,
      to    = null,
      limit  = 100,
      offset = 0,
    } = options;

    const allAlerts = await this.trafficService.getAlertHistory({
      camera_id:    cameraId,
      severity,
      road_segment,
      type:         alert_type,  // B2 alias: "type" = alert_type
      from,
      to,
    });

    const total = allAlerts.length;
    const items = allAlerts.slice(offset, offset + limit);

    return {
      items,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    };
  }

  // Acknowledge an alert.
  // - Numeric ID  → alert exists in B2's AlertRecord; delegate to B2.
  // - Synthetic ID (e.g. "ALERT-cam_01-…") → metric-derived B3 alert; store in-memory.
  async acknowledge(alertId, user) {
    const userId = user?.preferred_username || user?.sub || "unknown";

    if (_isNumericId(alertId)) {
      const b2Resp = await this.trafficService.acknowledgeAlert(alertId, userId);
      return {
        alertId:        String(b2Resp.alert_id ?? alertId),
        acknowledgedBy: b2Resp.admin_id ?? userId,
        acknowledgedAt: typeof b2Resp.acknowledged_at === "string"
          ? b2Resp.acknowledged_at
          : new Date(b2Resp.acknowledged_at).toISOString(),
        status: b2Resp.status ?? "acknowledged",
      };
    }

    // Synthetic alert: record in-memory only.
    const ack = {
      alertId,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
      status: "acknowledged",
    };
    this._acknowledged.set(alertId, ack);
    return ack;
  }

  // Returns a raw fetch Response streaming B2's CSV export directly.
  streamAlertExport(params = {}) {
    return this.trafficService.streamAlertExport({
      camera_id:    params.cameraId || params.camera_id || null,
      severity:     params.severity || null,
      road_segment: params.road_segment || null,
      type:         params.alert_type || null,
      from:         params.from || null,
      to:           params.to   || null,
    });
  }
}

function _isNumericId(id) {
  return /^\d+$/.test(String(id));
}

module.exports = AlertService;
