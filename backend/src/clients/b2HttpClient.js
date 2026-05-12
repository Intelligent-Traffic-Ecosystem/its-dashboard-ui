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

  async get(path, query = {}, extraHeaders = {}) {
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
        headers: { Accept: "application/json", ...extraHeaders },
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

  async post(path, body = {}, extraHeaders = {}) {
    return this._sendJson("POST", path, body, extraHeaders);
  }

  async put(path, body = {}, extraHeaders = {}) {
    return this._sendJson("PUT", path, body, extraHeaders);
  }

  async delete(path, extraHeaders = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetch(url, {
        method: "DELETE",
        headers: { Accept: "application/json", ...extraHeaders },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UpstreamError(`B2 returned ${response.status}`, {
          statusCode: response.status >= 500 ? 503 : response.status,
        });
      }

      // 204 No Content — no body to parse
      if (response.status === 204) return null;
      return response.json();
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      throw new UpstreamError("B2 DELETE request failed", { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }

  // Returns the raw fetch Response — use for binary/streaming endpoints (PDF, CSV).
  async streamGet(path, query = {}, extraHeaders = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response;
    try {
      response = await this.fetch(url, {
        method: "GET",
        headers: extraHeaders,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      throw new UpstreamError("B2 stream request failed", { cause: error });
    }

    clearTimeout(timeout); // don't abort while body is streaming
    if (!response.ok) {
      throw new UpstreamError(`B2 returned ${response.status}`, {
        statusCode: response.status >= 500 ? 503 : response.status,
      });
    }
    return response;
  }

  async _sendJson(method, path, body, extraHeaders) {
    const url = new URL(`${this.baseUrl}${path}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...extraHeaders,
        },
        body: JSON.stringify(body),
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
      throw new UpstreamError(`B2 ${method} request failed`, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = {
  B2HttpClient,
  UpstreamError,
};
