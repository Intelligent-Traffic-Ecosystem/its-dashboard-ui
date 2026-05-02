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
}

module.exports = TrafficDataProvider;
