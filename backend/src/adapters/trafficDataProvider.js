class TrafficDataProvider {
  getHealth() {
    throw new Error("TrafficDataProvider.getHealth must be implemented");
  }

  listCameras() {
    throw new Error("TrafficDataProvider.listCameras must be implemented");
  }

  getCurrentMetric() {
    throw new Error("TrafficDataProvider.getCurrentMetric must be implemented");
  }

  getMetricHistory() {
    throw new Error("TrafficDataProvider.getMetricHistory must be implemented");
  }

  getCurrentCongestion() {
    throw new Error("TrafficDataProvider.getCurrentCongestion must be implemented");
  }

  subscribeToMetrics() {
    throw new Error("TrafficDataProvider.subscribeToMetrics must be implemented");
  }

  getDashboardSummary() {
    throw new Error("TrafficDataProvider.getDashboardSummary must be implemented");
  }

  getDashboardEvents() {
    throw new Error("TrafficDataProvider.getDashboardEvents must be implemented");
  }

  subscribeLaneMetrics() {
    throw new Error("TrafficDataProvider.subscribeLaneMetrics must be implemented");
  }

  subscribeToEvents() {
    throw new Error("TrafficDataProvider.subscribeToEvents must be implemented");
  }

  getAnalyticsMetrics() {
    throw new Error("TrafficDataProvider.getAnalyticsMetrics must be implemented");
  }

  streamAnalyticsReportPdf() {
    throw new Error("TrafficDataProvider.streamAnalyticsReportPdf must be implemented");
  }

  getAlertHistory() {
    throw new Error("TrafficDataProvider.getAlertHistory must be implemented");
  }

  acknowledgeAlert() {
    throw new Error("TrafficDataProvider.acknowledgeAlert must be implemented");
  }

  streamAlertExport() {
    throw new Error("TrafficDataProvider.streamAlertExport must be implemented");
  }

  getCongestionPrediction() {
    throw new Error("TrafficDataProvider.getCongestionPrediction must be implemented");
  }
}

module.exports = TrafficDataProvider;
