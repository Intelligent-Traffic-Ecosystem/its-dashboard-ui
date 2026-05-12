"use strict";

const { EventEmitter } = require("events");

/**
 * UpstreamRouter — picks between primary (real B2) and fallback (mock B2) URLs.
 *
 * Health probe pings `${primary.base}/health` every `probeIntervalMs`. After
 * `failureThreshold` consecutive failures (or non-ok payloads) the router
 * flips to fallback. After `recoveryThreshold` consecutive successes it flips
 * back. Listeners (HTTP + WS clients) receive a "change" event on every flip
 * and use `urls()` to re-resolve.
 *
 * Falling back is intentionally conservative: we'd rather show stale mock
 * data than blink the UI on a transient blip.
 */

const DEFAULTS = {
    probeIntervalMs: 10_000,
    probeTimeoutMs: 3_000,
    failureThreshold: 3,
    recoveryThreshold: 3,
    cooldownMs: 30_000,
};

class UpstreamRouter extends EventEmitter {
    constructor({ primary, fallback, options = {}, fetchImpl = fetch, log = console }) {
        super();
        if (!primary || !fallback) {
            throw new Error("UpstreamRouter requires primary and fallback URL sets");
        }
        this.primary = this._normalize(primary);
        this.fallback = this._normalize(fallback);
        this.options = { ...DEFAULTS, ...options };
        this.fetch = fetchImpl;
        this.log = log;

        this.active = "primary";
        this.lastSwitchAt = null;
        this.lastProbeAt = null;
        this.lastProbeOk = null;
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;

        this._timer = null;
        this._started = false;
    }

    _normalize(set) {
        return {
            base: set.base.replace(/\/$/, ""),
            wsMetrics: set.wsMetrics,
            wsLanes: set.wsLanes,
            wsEvents: set.wsEvents,
        };
    }

    urls() {
        return this.active === "primary" ? this.primary : this.fallback;
    }

    status() {
        return {
            active: this.active,
            lastSwitchAt: this.lastSwitchAt,
            lastProbeAt: this.lastProbeAt,
            lastProbeOk: this.lastProbeOk,
            consecutiveFailures: this.consecutiveFailures,
            consecutiveSuccesses: this.consecutiveSuccesses,
            primary: this.primary.base,
            fallback: this.fallback.base,
        };
    }

    start() {
        if (this._started) return;
        this._started = true;
        this._scheduleProbe(0);
    }

    stop() {
        this._started = false;
        if (this._timer) clearTimeout(this._timer);
        this._timer = null;
    }

    _scheduleProbe(delay) {
        if (!this._started) return;
        this._timer = setTimeout(() => this._probe(), delay);
    }

    async _probe() {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), this.options.probeTimeoutMs);
        let ok = false;
        try {
            const res = await this.fetch(`${this.primary.base}/health`, {
                signal: controller.signal,
                headers: { Accept: "application/json" },
            });
            if (res.ok) {
                let body = null;
                try {
                    body = await res.json();
                } catch {
                    body = null;
                }
                ok = !body || body.status === "ok" || body.status === undefined;
            }
        } catch {
            ok = false;
        } finally {
            clearTimeout(t);
        }

        this.lastProbeAt = new Date().toISOString();
        this.lastProbeOk = ok;
        if (ok) {
            this.consecutiveSuccesses += 1;
            this.consecutiveFailures = 0;
        } else {
            this.consecutiveFailures += 1;
            this.consecutiveSuccesses = 0;
        }

        this._applyState();
        this._scheduleProbe(this.options.probeIntervalMs);
    }

    /** Externally reportable signal — HTTP/WS clients call this on hard failures.
     *  Only acts while we're targeting primary; failures on fallback don't
     *  influence routing (the periodic probe of primary owns the recovery
     *  decision). */
    reportFailure(reason) {
        if (this.active !== "primary") return;
        this.consecutiveFailures += 1;
        this.consecutiveSuccesses = 0;
        this.lastProbeAt = new Date().toISOString();
        this.lastProbeOk = false;
        this.log.warn(`[upstream-router] reportFailure: ${reason || "unspecified"}`);
        this._applyState();
    }

    _applyState() {
        const now = Date.now();
        const cooldownPassed =
            !this.lastSwitchAt || now - new Date(this.lastSwitchAt).getTime() >= this.options.cooldownMs;

        if (
            this.active === "primary" &&
            this.consecutiveFailures >= this.options.failureThreshold
        ) {
            this._switch("fallback");
        } else if (
            this.active === "fallback" &&
            this.consecutiveSuccesses >= this.options.recoveryThreshold &&
            cooldownPassed
        ) {
            this._switch("primary");
        }
    }

    _switch(target) {
        if (this.active === target) return;
        const from = this.active;
        this.active = target;
        this.lastSwitchAt = new Date().toISOString();
        this.consecutiveFailures = 0;
        this.consecutiveSuccesses = 0;
        this.log.warn(`[upstream-router] switching ${from} → ${target}`);
        this.emit("change", { from, to: target, urls: this.urls() });
    }
}

module.exports = UpstreamRouter;
