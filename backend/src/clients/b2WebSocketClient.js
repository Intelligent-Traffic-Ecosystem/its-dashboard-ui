const WebSocket = require("ws");

/**
 * Subscribes to a B2 WebSocket feed. Two construction modes:
 *
 *   - Static URL  : new B2WebSocketClient({ url, reconnectMs })
 *   - Routed      : new B2WebSocketClient({ router, key, reconnectMs })
 *
 * When constructed with a router, the active URL is resolved from
 * `router.urls()[key]` (key = "wsMetrics" | "wsLanes" | "wsEvents"). The
 * client listens for the router's `change` event and force-reconnects to
 * the new URL within `reconnectMs`.
 */
class B2WebSocketClient {
  constructor({ url, reconnectMs, WebSocketImpl = WebSocket, router = null, key = null }) {
    this.staticUrl = url || null;
    this.router = router;
    this.routerKey = key;
    this.reconnectMs = reconnectMs;
    this.WebSocketImpl = WebSocketImpl;
    this.socket = null;
    this.stopped = true;
    this.reconnectTimer = null;
    this._routerHandler = null;
    this.connected = false;
    this.currentUrl = null;
  }

  _resolveUrl() {
    if (this.router) {
      const urls = this.router.urls();
      return urls[this.routerKey];
    }
    return this.staticUrl;
  }

  subscribe(onMessage) {
    this.stopped = false;
    this.onMessage = onMessage;

    if (this.router) {
      this._routerHandler = () => this._forceReconnect();
      this.router.on("change", this._routerHandler);
    }

    this.connect();

    return () => this.stop();
  }

  _forceReconnect() {
    if (this.stopped) return;
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        /* noop */
      }
    }
    // scheduleReconnect runs via the close handler
  }

  connect() {
    if (this.stopped) return;

    const url = this._resolveUrl();
    if (!url) {
      console.warn("B2 websocket: no URL resolved, retrying later");
      return this.scheduleReconnect();
    }
    this.currentUrl = url;

    this.socket = new this.WebSocketImpl(url);

    this.socket.on("open", () => {
      this.connected = true;
    });

    this.socket.on("message", (message) => {
      try {
        const payload = JSON.parse(message.toString());
        this.onMessage(payload);
      } catch (error) {
        console.warn("B2 websocket message ignored:", error.message);
      }
    });

    this.socket.on("close", () => {
      this.connected = false;
      // Don't report WS closes to the router. Periodic idle-timeouts and
      // graceful reconnects are normal for these streams and would cause
      // the router to flap. The HTTP /health probe is the source of truth
      // for primary↔fallback routing.
      this.scheduleReconnect();
    });

    this.socket.on("error", (error) => {
      console.warn(`B2 websocket error (${this.routerKey || "static"}):`, error.message);
      if (this.socket?.readyState === this.WebSocketImpl.OPEN) {
        this.socket.close();
      }
    });
  }

  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectMs);
  }

  stop() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.router && this._routerHandler) {
      this.router.off("change", this._routerHandler);
      this._routerHandler = null;
    }
    if (this.socket) this.socket.close();
    this.socket = null;
  }
}

module.exports = B2WebSocketClient;
