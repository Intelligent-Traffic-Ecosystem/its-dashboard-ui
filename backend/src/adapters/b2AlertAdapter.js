/**
 * Adapts the B2 /api/alerts/* endpoints to the shape expected by B3's AlertService.
 *
 * B2 severity values are uppercase (WARNING, CRITICAL, EMERGENCY).
 * B3 frontend expects lowercase (warning, critical, emergency, informational).
 */

const SEVERITY_MAP = {
  EMERGENCY: "emergency",
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "informational",
};

const B2_SEVERITY_MAP = {
  emergency: "EMERGENCY",
  critical: "CRITICAL",
  warning: "WARNING",
  informational: "INFO",
};

function toB3Severity(b2Severity) {
  return SEVERITY_MAP[String(b2Severity).toUpperCase()] || "informational";
}

function toB2Severity(severity) {
  const value = String(severity || "").toLowerCase();
  return B2_SEVERITY_MAP[value] || severity;
}

/** Map a B2 AlertOutput object → TrafficAlert shape consumed by the B3 frontend */
function mapB2AlertToTrafficAlert(b2Alert) {
  return {
    id: String(b2Alert.id),
    cameraId: b2Alert.camera_id,
    severity: toB3Severity(b2Alert.severity),
    title: b2Alert.title,
    description: b2Alert.message,
    status: b2Alert.acknowledged ? "acknowledged" : "active",
    timestamp: b2Alert.triggered_at,
    roadSegment: b2Alert.road_segment || null,
    alertType: b2Alert.alert_type || null,
    congestionLevel: b2Alert.congestion_level || null,
    congestionScore: b2Alert.congestion_score ?? null,
    resolvedAt: b2Alert.resolved_at || null,
    acknowledgedBy: b2Alert.acknowledged_by || null,
    acknowledgedAt: b2Alert.acknowledged_at || null,
    details: {
      vehicleCount: 0,
      averageSpeedKmh: 0,
      congestionScore: b2Alert.congestion_score ?? 0,
      queueLength: 0,
    },
  };
}

/** Map a B2 AlertOutput (acknowledged) → history item shape */
function mapB2AlertToHistoryItem(b2Alert) {
  return {
    alertId: String(b2Alert.id),
    cameraId: b2Alert.camera_id,
    severity: toB3Severity(b2Alert.severity),
    title: b2Alert.title,
    roadSegment: b2Alert.road_segment || null,
    congestionScore: b2Alert.congestion_score ?? null,
    triggeredAt: b2Alert.triggered_at,
    acknowledgedBy: b2Alert.acknowledged_by || "unknown",
    acknowledgedAt: b2Alert.acknowledged_at,
    status: "acknowledged",
  };
}

class B2AlertAdapter {
  /**
   * @param {import('../clients/b2HttpClient').B2HttpClient} httpClient
   */
  constructor(httpClient) {
    this.httpClient = httpClient;
  }

  /** Fetch all unacknowledged alerts from B2 */
  async listActiveAlerts() {
    const alerts = await this.httpClient.get("/api/alerts/active");
    return Array.isArray(alerts) ? alerts.map(mapB2AlertToTrafficAlert) : [];
  }

  /**
   * Acknowledge an alert in B2 and return the history-item shape.
   * @param {string|number} alertId  - numeric B2 alert ID (may arrive as string)
   * @param {string}        userId   - display name of the user performing the action
   */
  async acknowledgeAlert(alertId, userId) {
    const result = await this.httpClient.post(`/api/alerts/${alertId}/acknowledge`, {
      admin_id: userId || "operator",
    });
    return {
      alertId: String(result.alert_id),
      acknowledgedBy: result.admin_id,
      acknowledgedAt: result.acknowledged_at,
      status: result.status,
    };
  }

  /**
   * Fetch acknowledged alert history from B2.
   * @param {object} options - {cameraId, severity, from, to, limit, offset}
   */
  async getAlertHistory(options = {}) {
    const { cameraId, severity, from: fromDate, to: toDate, limit = 100, offset = 0 } = options;

    const query = {};
    if (cameraId) query.camera_id = cameraId;
    if (severity) query.severity = toB2Severity(severity);
    if (fromDate) query.from = fromDate;
    if (toDate) query.to = toDate;

    const allAlerts = await this.httpClient.get("/api/alerts/history", query);
    if (!Array.isArray(allAlerts)) return { items: [], pagination: { total: 0, limit, offset, hasMore: false } };

    // History section shows only acknowledged alerts
    const acknowledged = allAlerts.filter((a) => a.acknowledged);
    const total = acknowledged.length;
    const items = acknowledged
      .sort((a, b) => new Date(b.acknowledged_at) - new Date(a.acknowledged_at))
      .slice(offset, offset + limit)
      .map(mapB2AlertToHistoryItem);

    return {
      items,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    };
  }

  /**
   * Stream the B2 CSV export directly (returns raw fetch Response for piping).
   * @param {object} params - {cameraId, severity, from, to}
   */
  streamAlertExport(params = {}) {
    const query = {};
    if (params.cameraId || params.camera_id) query.camera_id = params.cameraId || params.camera_id;
    if (params.severity) query.severity = toB2Severity(params.severity);
    if (params.road_segment) query.road_segment = params.road_segment;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    return this.httpClient.streamGet("/api/alerts/export", query);
  }
}

module.exports = { B2AlertAdapter };
