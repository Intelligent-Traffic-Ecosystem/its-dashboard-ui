class HealthService {
  constructor(provider) {
    this.provider = provider;
  }

  async getHealth() {
    const routerStatus = this.provider.router ? this.provider.router.status() : null;

    try {
      const upstream = await this.provider.getHealth();
      const degraded =
        upstream.status !== "ok" || upstream.kafka !== "ok" || upstream.postgres !== "ok";

      return {
        status: degraded ? "degraded" : "ok",
        service: "b3-dashboard-backend",
        upstream: {
          b2: upstream,
          router: routerStatus,
        },
      };
    } catch {
      // Even when the upstream call throws, the router may already have
      // flipped to fallback — surface that explicitly.
      const onFallback = routerStatus && routerStatus.active === "fallback";
      return {
        status: onFallback ? "ok" : "degraded",
        service: "b3-dashboard-backend",
        upstream: {
          b2: { status: "unreachable" },
          router: routerStatus,
        },
      };
    }
  }
}

module.exports = HealthService;
