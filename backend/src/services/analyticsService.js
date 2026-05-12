class AnalyticsService {
  constructor(trafficService) {
    this.trafficService = trafficService;
    // trafficService exposes getAnalyticsMetrics / streamAnalyticsReportPdf
    // which delegate to B2's /api/analytics/* endpoints.
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

  async getTrends(cameraId, from, to) {
    const metrics = await this.trafficService.getMetricHistory(cameraId, from, to);

    if (!metrics.length) {
      return {
        cameraId,
        from,
        to,
        trend: "no_data",
        percentageChange: 0,
        speedTrend: "no_data",
        speedChange: 0,
        peakHour: null,
        lowestCongestionWindow: null,
        highestCongestionWindow: null,
        series: [],
      };
    }

    // Sort by timestamp
    const sorted = [...metrics].sort((a, b) => {
      const aTime = new Date(a.timestamp || a.windowEnd).getTime();
      const bTime = new Date(b.timestamp || b.windowEnd).getTime();
      return aTime - bTime;
    });

    // Calculate mid-point for trend comparison
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const getAvg = (arr, field) =>
      arr.length ? arr.reduce((sum, m) => sum + m[field], 0) / arr.length : 0;

    const firstCongestion = getAvg(firstHalf, "congestionScore");
    const secondCongestion = getAvg(secondHalf, "congestionScore");
    const percentageChange =
      firstCongestion === 0
        ? 0
        : Number((((secondCongestion - firstCongestion) / firstCongestion) * 100).toFixed(2));

    const firstSpeed = getAvg(firstHalf, "averageSpeedKmh");
    const secondSpeed = getAvg(secondHalf, "averageSpeedKmh");
    const speedChange =
      firstSpeed === 0 ? 0 : Number((((secondSpeed - firstSpeed) / firstSpeed) * 100).toFixed(2));

    // Find peak and lowest congestion windows
    const highestCongestionWindow = sorted.reduce((highest, metric) => {
      if (!highest || metric.congestionScore > highest.congestionScore) return metric;
      return highest;
    }, null);

    const lowestCongestionWindow = sorted.reduce((lowest, metric) => {
      if (!lowest || metric.congestionScore < lowest.congestionScore) return metric;
      return lowest;
    }, null);

    // Determine trends
    const congestionTrend =
      percentageChange > 5 ? "increasing" : percentageChange < -5 ? "decreasing" : "stable";
    const speedTrend =
      speedChange > 5 ? "increasing" : speedChange < -5 ? "decreasing" : "stable";

    return {
      cameraId,
      from,
      to,
      trend: congestionTrend,
      percentageChange,
      speedTrend,
      speedChange,
      peakHour: {
        ...highestCongestionWindow,
        timestamp: highestCongestionWindow?.timestamp || highestCongestionWindow?.windowEnd,
      },
      lowestCongestionWindow: {
        ...lowestCongestionWindow,
        timestamp: lowestCongestionWindow?.timestamp || lowestCongestionWindow?.windowEnd,
      },
      series: sorted.map((m) => ({
        timestamp: m.timestamp || m.windowEnd,
        congestionScore: m.congestionScore,
        averageSpeedKmh: m.averageSpeedKmh,
        vehicleCount: m.vehicleCount,
      })),
    };
  }

  async getMetrics(from, to) {
    try {
      // Delegate to B2's optimised SQL aggregation.
      // B2 params are named start/end; B3 routes use from/to.
      return await this.trafficService.getAnalyticsMetrics(from, to);
    } catch (err) {
      console.error("AnalyticsService.getMetrics error:", err);
      return {
        range_start: from,
        range_end: to,
        avg_congestion_score: 0,
        peak_hour_distribution: [],
        top_segments: [],
        incident_pie: [],
      };
    }
  }

  // Streams the PDF report directly from B2; returns a raw fetch Response.
  streamReportPdf(from, to) {
    return this.trafficService.streamAnalyticsReportPdf(from, to);
  }
}

module.exports = AnalyticsService;
