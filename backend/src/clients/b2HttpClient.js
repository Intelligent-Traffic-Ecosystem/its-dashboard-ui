class UpstreamError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "UpstreamError";
    this.statusCode = options.statusCode || 503;
    this.code = options.code || "b2_upstream_error";
    this.publicMessage = options.publicMessage || "B2 data service is unavailable";
    this.cause = options.cause;
  }
}

class B2HttpClient {
  constructor({ baseUrl, timeoutMs, fetchImpl = fetch }) {
    this.baseUrl = baseUrl.replace(/\/$/, "").replace("localhost", "127.0.0.1");
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  async get(path, query = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UpstreamError(`B2 returned ${response.status}`, {
          statusCode: response.status >= 500 ? 503 : response.status,
        });
      }

      return response.json();
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      throw new UpstreamError("B2 request failed", { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = {
  B2HttpClient,
  UpstreamError,
};
