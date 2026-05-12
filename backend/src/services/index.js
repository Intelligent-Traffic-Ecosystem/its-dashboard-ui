const env = require("../config/env");
const { createB2TrafficDataAdapter } = require("../adapters/b2TrafficDataAdapter");
const { B2AlertAdapter } = require("../adapters/b2AlertAdapter");
const { B2HttpClient } = require("../clients/b2HttpClient");
const TrafficService = require("./trafficService");
const AnalyticsService = require("./analyticsService");
const AlertService = require("./alertService");
const HealthService = require("./healthService");
const AdminService = require("./adminService");
const DashboardService = require("./dashboardService");
const MapService = require("./mapService");

const trafficDataProvider = createB2TrafficDataAdapter(env);

// Shared HTTP client pointed at B2 API root (no /api prefix — adapter adds it)
const b2RootHttpClient = new B2HttpClient({
  baseUrl: env.b2ApiBaseUrl,
  timeoutMs: env.b2RequestTimeoutMs,
});

const b2AlertAdapter = new B2AlertAdapter(b2RootHttpClient);

const trafficService = new TrafficService(trafficDataProvider);
const analyticsService = new AnalyticsService(trafficService);
const alertService = new AlertService(b2AlertAdapter);
const healthService = new HealthService(trafficDataProvider);
const adminService = new AdminService({ httpClient: trafficDataProvider.httpClient });
const dashboardService = new DashboardService({ trafficService });
const mapService = new MapService({ trafficService, alertService, adminService });

module.exports = {
  trafficDataProvider,
  trafficService,
  analyticsService,
  alertService,
  healthService,
  adminService,
  dashboardService,
  mapService,
};
