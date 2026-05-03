const WebSocket = require("ws");

class B2WebSocketClient {
  constructor({ url, reconnectMs, WebSocketImpl = WebSocket }) {
    this.url = url;
    this.reconnectMs = reconnectMs;
    this.WebSocketImpl = WebSocketImpl;
    this.socket = null;
    this.stopped = true;
    this.reconnectTimer = null;
  }

  subscribe(onMessage) {
    this.stopped = false;
    this.onMessage = onMessage;
    this.connect();

    return () => this.stop();
  }

  connect() {
    if (this.stopped) return;

    this.socket = new this.WebSocketImpl(this.url);

    this.socket.on("message", (message) => {
      try {
        const payload = JSON.parse(message.toString());
        this.onMessage(payload);
      } catch (error) {
        console.warn("B2 websocket message ignored:", error.message);
      }
    });

    this.socket.on("close", () => this.scheduleReconnect());
    this.socket.on("error", (error) => {
      console.warn("B2 websocket error:", error.message);
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
    if (this.socket) this.socket.close();
    this.socket = null;
  }
}

module.exports = B2WebSocketClient;
