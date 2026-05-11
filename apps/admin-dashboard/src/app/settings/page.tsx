"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSystemHealth, getThresholds, type SystemHealth, type Thresholds, BACKEND_BASE_URL } from "@/lib/backend";

const LOGIN_APP_URL = process.env.NEXT_PUBLIC_LOGIN_APP_URL || "http://localhost:3003";

function StatusBadge({ status }: { status: string }) {
  const ok = status === "ok";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-caps text-label-caps ${
        ok
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-error/10 text-error border border-error/20"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-error"}`} />
      {status.toUpperCase()}
    </span>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data text-sm select-all">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-surface-container-highest border border-white/10 flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{icon}</span>
      </div>
      <div>
        <h3 className="font-title-md text-title-md text-on-surface">{title}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(false);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [thresholdsLoading, setThresholdsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(false);
    try {
      const h = await getSystemHealth();
      setHealth(h);
      setLastRefreshed(new Date());
    } catch {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    getThresholds()
      .then(setThresholds)
      .catch(() => {})
      .finally(() => setThresholdsLoading(false));
  }, [fetchHealth]);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface mb-2">Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          System configuration overview. Most values are set via environment variables and are read-only here.
        </p>
      </div>

      {/* System Health */}
      <div className="bg-surface-container rounded-xl border border-white/10 p-6">
        <SectionHeader
          icon="monitor_heart"
          title="System Health"
          description="Live status of the backend and upstream B2 Data API dependencies."
        />
        {healthLoading ? (
          <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Checking system status…
          </div>
        ) : healthError ? (
          <div className="flex items-center gap-2 text-error font-body-sm text-body-sm py-4">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Backend unreachable — {BACKEND_BASE_URL}
          </div>
        ) : health ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">BACKEND (B3)</p>
                  <p className="font-body-sm text-body-sm text-on-surface">{health.service}</p>
                </div>
                <StatusBadge status={health.status} />
              </div>
              <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">B2 DATA API</p>
                  <p className="font-body-sm text-body-sm text-on-surface">Traffic sensor upstream</p>
                </div>
                <StatusBadge status={health.upstream.b2.status} />
              </div>
              {health.upstream.b2.kafka && (
                <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">KAFKA</p>
                    <p className="font-body-sm text-body-sm text-on-surface">Event streaming broker</p>
                  </div>
                  <StatusBadge status={health.upstream.b2.kafka} />
                </div>
              )}
              {health.upstream.b2.postgres && (
                <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">POSTGRESQL</p>
                    <p className="font-body-sm text-body-sm text-on-surface">Primary data store</p>
                  </div>
                  <StatusBadge status={health.upstream.b2.postgres} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {lastRefreshed && `Last checked at ${lastRefreshed.toLocaleTimeString()}`}
              </p>
              <button
                onClick={fetchHealth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-label-caps text-label-caps"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Connection Configuration */}
      <div className="bg-surface-container rounded-xl border border-white/10 p-6">
        <SectionHeader
          icon="cable"
          title="Connection Configuration"
          description="Endpoint URLs configured via environment variables."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="BACKEND API URL" value={BACKEND_BASE_URL} />
          <ReadOnlyField label="LOGIN APP URL" value={LOGIN_APP_URL} />
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-surface-container rounded-xl border border-white/10 p-6">
        <div className="flex items-start justify-between mb-5">
          <SectionHeader
            icon="tune"
            title="Alert Thresholds"
            description="Current congestion levels that trigger automated system alerts."
          />
          <Link
            href="/alert-config"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-label-caps text-label-caps ml-4 mt-1"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Configure
          </Link>
        </div>
        {thresholdsLoading ? (
          <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading thresholds…
          </div>
        ) : thresholds ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 text-center">
              <div className="w-2 h-2 rounded-full bg-secondary-fixed-dim mx-auto mb-2" />
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">WARNING</p>
              <p className="font-display-lg text-display-lg text-on-surface">
                {Math.round(thresholds.congestion_threshold_low * 100)}
                <span className="text-title-sm text-on-surface-variant">%</span>
              </p>
            </div>
            <div className="bg-surface-container-highest rounded-lg border border-white/5 p-4 text-center">
              <div className="w-2 h-2 rounded-full bg-tertiary-container mx-auto mb-2" />
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">CRITICAL</p>
              <p className="font-display-lg text-display-lg text-on-surface">
                {Math.round(thresholds.congestion_threshold_moderate * 100)}
                <span className="text-title-sm text-on-surface-variant">%</span>
              </p>
            </div>
            <div className="bg-surface-container-highest rounded-lg border border-error/20 p-4 text-center">
              <div className="w-2 h-2 rounded-full bg-error mx-auto mb-2" />
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">EMERGENCY</p>
              <p className="font-display-lg text-display-lg text-error">
                {Math.round(thresholds.congestion_threshold_high * 100)}
                <span className="text-title-sm text-error/60">%</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Could not load thresholds — backend may be offline.
          </p>
        )}
      </div>

      {/* System Information */}
      <div className="bg-surface-container rounded-xl border border-white/10 p-6">
        <SectionHeader
          icon="info"
          title="System Information"
          description="Static identifiers and authentication provider details for this deployment."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadOnlyField label="SYSTEM NAME" value="ITMS Admin" />
          <ReadOnlyField label="AUTH PROVIDER" value="Keycloak" />
          <ReadOnlyField label="KEYCLOAK REALM" value="its-realm" />
          <ReadOnlyField label="BACKEND SERVICE" value="b3-dashboard-backend" />
        </div>
      </div>
    </div>
  );
}
