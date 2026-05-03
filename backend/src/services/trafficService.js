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
}

module.exports = TrafficService;
