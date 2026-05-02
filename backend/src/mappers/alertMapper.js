function severityFromMetric(metric) {
  const level = String(metric?.congestionLevel || "LOW").toUpperCase();
  const score = Number(metric?.congestionScore || 0);

  if (score >= 90) return "emergency";
  if (level === "HIGH") return "critical";
  if (level === "MEDIUM") return "warning";
  return "informational";
}

function shouldCreateActiveAlert(metric) {
  return ["warning", "critical", "emergency"].includes(severityFromMetric(metric));
}

function mapMetricToAlert(metric) {
  const severity = severityFromMetric(metric);

  return {
    id: `ALERT-${metric.cameraId}-${metric.windowEnd || metric.windowStart || "latest"}`,
    type: "congestion",
    severity,
    cameraId: metric.cameraId,
    title: `${severity.toUpperCase()} congestion at ${metric.cameraId}`,
    description: `Congestion score ${metric.congestionScore.toFixed(1)} with ${metric.vehicleCount} vehicles in the latest window.`,
    status: "active",
    timestamp: metric.windowEnd || metric.windowStart || new Date().toISOString(),
    details: {
      averageSpeedKmh: metric.averageSpeedKmh,
      queueLength: metric.queueLength,
      stoppedRatio: metric.stoppedRatio,
      congestionLevel: metric.congestionLevel,
    },
  };
}

module.exports = {
  severityFromMetric,
  shouldCreateActiveAlert,
  mapMetricToAlert,
};
