class TrafficService {
  constructor(provider) {
    this.provider = provider;
  }

  listCameras() {
    return this.provider.listCameras();
  }

  getCurrentMetric(cameraId) {
    return this.provider.getCurrentMetric(cameraId);
  }

  getMetricHistory(cameraId, from, to) {
    return this.provider.getMetricHistory(cameraId, from, to);
  }

  getCurrentCongestion() {
    return this.provider.getCurrentCongestion();
  }

  getDashboardSummary() {
    return this.provider.getDashboardSummary();
  }

  getDashboardEvents(limit) {
    return this.provider.getDashboardEvents(limit);
  }

  getAnalyticsMetrics(start, end) {
    return this.provider.getAnalyticsMetrics(start, end);
  }

  streamAnalyticsReportPdf(start, end) {
    return this.provider.streamAnalyticsReportPdf(start, end);
  }

  getAlertHistory(params) {
    return this.provider.getAlertHistory(params);
  }

  acknowledgeAlert(alertId, userId) {
    return this.provider.acknowledgeAlert(alertId, userId);
  }

  streamAlertExport(params) {
    return this.provider.streamAlertExport(params);
  }

  getCongestionPrediction(cameraId, horizonMinutes, lookbackMinutes) {
    return this.provider.getCongestionPrediction(cameraId, horizonMinutes, lookbackMinutes);
  }
}

module.exports = TrafficService;
