class AnalyticsService {
  constructor(trafficService) {
    this.trafficService = trafficService;
  }

  async getSummary(cameraId, from, to) {
    const metrics = await this.trafficService.getMetricHistory(cameraId, from, to);
    const totalWindows = metrics.length;
    const totalVehicles = metrics.reduce((sum, metric) => sum + metric.vehicleCount, 0);
    const averageCongestionScore =
      totalWindows === 0
        ? 0
        : metrics.reduce((sum, metric) => sum + metric.congestionScore, 0) / totalWindows;
    const averageSpeedKmh =
      totalWindows === 0
        ? 0
        : metrics.reduce((sum, metric) => sum + metric.averageSpeedKmh, 0) / totalWindows;
    const peakWindow = metrics.reduce((peak, metric) => {
      if (!peak || metric.vehicleCount > peak.vehicleCount) return metric;
      return peak;
    }, null);

    return {
      cameraId,
      from,
      to,
      totalWindows,
      totalVehicles,
      averageCongestionScore: Number(averageCongestionScore.toFixed(2)),
      averageSpeedKmh: Number(averageSpeedKmh.toFixed(2)),
      peakWindow,
      series: metrics,
    };
  }
}

module.exports = AnalyticsService;
