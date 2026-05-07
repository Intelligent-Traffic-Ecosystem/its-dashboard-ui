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
      // Fetch all metrics within the range (would come from B2 in production)
      // For now, use mock data across cameras
      const mockCameras = ["CAM-001", "CAM-002", "CAM-003", "CAM-004", "CAM-005"];
      let allMetrics = [];

      for (const cameraId of mockCameras) {
        try {
          const metrics = await this.trafficService.getMetricHistory(cameraId, from, to);
          allMetrics = allMetrics.concat(metrics);
        } catch (err) {
          // Skip cameras that fail
          console.warn(`Failed to fetch metrics for ${cameraId}:`, err.message);
        }
      }

      // Calculate average congestion score
      const avgCongestionScore =
        allMetrics.length > 0
          ? allMetrics.reduce((sum, m) => sum + m.congestionScore, 0) / allMetrics.length
          : 0;

      // Calculate peak hour distribution (by hour of day)
      const hourMap = {};
      allMetrics.forEach((metric) => {
        const date = new Date(metric.timestamp || metric.windowEnd);
        const hour = date.getUTCHours();

        if (!hourMap[hour]) {
          hourMap[hour] = { count: 0, vehicleSum: 0, congestionSum: 0 };
        }
        hourMap[hour].count++;
        hourMap[hour].vehicleSum += metric.vehicleCount || 0;
        hourMap[hour].congestionSum += metric.congestionScore || 0;
      });

      const peakHourDistribution = Object.entries(hourMap)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          avg_vehicle_count: Number((data.vehicleSum / data.count).toFixed(2)),
          avg_congestion_score: Number((data.congestionSum / data.count).toFixed(2)),
        }))
        .sort((a, b) => a.hour - b.hour);

      // Top segments (top 10 cameras by congestion)
      const cameraMetrics = {};
      allMetrics.forEach((metric) => {
        if (!cameraMetrics[metric.cameraId]) {
          cameraMetrics[metric.cameraId] = {
            cameraId: metric.cameraId,
            congestionSum: 0,
            severeCount: 0,
            count: 0,
            roadSegment: null, // Would be populated from AdminService cameras
          };
        }
        cameraMetrics[metric.cameraId].congestionSum += metric.congestionScore;
        cameraMetrics[metric.cameraId].severeCount += metric.congestionLevel === "SEVERE" ? 1 : 0;
        cameraMetrics[metric.cameraId].count++;
      });

      const topSegments = Object.values(cameraMetrics)
        .map((cam) => ({
          camera_id: cam.cameraId,
          road_segment: cam.roadSegment,
          avg_congestion_score: Number((cam.congestionSum / cam.count).toFixed(2)),
          severe_minutes: cam.severeCount * 5, // Assuming 5-minute windows
        }))
        .sort((a, b) => b.avg_congestion_score - a.avg_congestion_score)
        .slice(0, 10);

      // Incident pie (would aggregate from AlertService in full implementation)
      const incidentPie = [
        { severity: "WARNING", count: Math.floor(Math.random() * 100) + 50 },
        { severity: "CRITICAL", count: Math.floor(Math.random() * 30) + 10 },
        { severity: "EMERGENCY", count: Math.floor(Math.random() * 5) },
      ];

      return {
        range_start: from,
        range_end: to,
        avg_congestion_score: Number(avgCongestionScore.toFixed(2)),
        peak_hour_distribution: peakHourDistribution,
        top_segments: topSegments,
        incident_pie: incidentPie,
      };
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
}

module.exports = AnalyticsService;
