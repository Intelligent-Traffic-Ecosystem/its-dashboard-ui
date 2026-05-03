class HealthService {
  constructor(provider) {
    this.provider = provider;
  }

  async getHealth() {
    try {
      const upstream = await this.provider.getHealth();
      const degraded = upstream.status !== "ok" || upstream.kafka !== "ok" || upstream.postgres !== "ok";

      return {
        status: degraded ? "degraded" : "ok",
        service: "b3-dashboard-backend",
        upstream: {
          b2: upstream,
        },
      };
    } catch {
      return {
        status: "degraded",
        service: "b3-dashboard-backend",
        upstream: {
          b2: {
            status: "unreachable",
          },
        },
      };
    }
  }
}

module.exports = HealthService;
