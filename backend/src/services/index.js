const env = require("../config/env");
const { createB2TrafficDataAdapter } = require("../adapters/b2TrafficDataAdapter");
const TrafficService = require("./trafficService");
const AnalyticsService = require("./analyticsService");
const AlertService = require("./alertService");
const HealthService = require("./healthService");
const AdminService = require("./adminService");
const DashboardService = require("./dashboardService");
const MapService = require("./mapService");

const trafficDataProvider = createB2TrafficDataAdapter(env);
const trafficService = new TrafficService(trafficDataProvider);
const analyticsService = new AnalyticsService(trafficService);
const alertService = new AlertService(trafficService);
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
