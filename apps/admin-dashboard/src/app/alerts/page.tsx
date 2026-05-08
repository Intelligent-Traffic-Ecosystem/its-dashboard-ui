"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getActiveAlerts,
  getAlertHistory,
  acknowledgeAlert,
  alertsExportUrl,
  type Alert,
  type AlertFilters,
} from "@/lib/backend";

const SEVERITY_STYLE: Record<string, string> = {
  EMERGENCY: "bg-error-container text-on-error-container border-error/20",
  CRITICAL: "bg-error/15 text-error border-error/20",
  WARNING: "bg-tertiary/15 text-tertiary border-tertiary/20",
};

const SEVERITY_ICON: Record<string, string> = {
  EMERGENCY: "crisis_alert",
  CRITICAL: "gpp_maybe",
  WARNING: "warning",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tab = "active" | "history";

export default function AlertsPage() {
  const [tab, setTab] = useState<Tab>("active");

  // Active alerts
  const [active, setActive] = useState<Alert[]>([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<Alert[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const PAGE = 20;

  // Filters
  const [severity, setSeverity] = useState("");
  const [alertType, setAlertType] = useState("");
  const [cameraId, setCameraId] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    setActiveLoading(true);
    try {
      const data = await getActiveAlerts();
      setActive(data);
    } catch {
      setActive([]);
    } finally {
      setActiveLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (filters: AlertFilters, page: number) => {
    setHistoryLoading(true);
    try {
      const data = await getAlertHistory({ ...filters, limit: PAGE, offset: page * PAGE });
      setHistory(data.items);
      setTotal(data.pagination.total);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActive();
    const id = setInterval(loadActive, 30_000);
    return () => clearInterval(id);
  }, [loadActive]);

  useEffect(() => {
    if (tab === "history") {
      loadHistory({ severity: severity || undefined, alert_type: alertType || undefined, cameraId: cameraId || undefined }, offset);
    }
  }, [tab, severity, alertType, cameraId, offset, loadHistory]);

  const handleAcknowledge = async (id: string) => {
    setAcknowledging(id);
    try {
      await acknowledgeAlert(id);
      setActive((prev) => prev.filter((a) => a.id !== id));
      setToast("Alert acknowledged.");
    } catch {
      setToast("Failed to acknowledge alert.");
    } finally {
      setAcknowledging(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const exportUrl = alertsExportUrl({
    severity: severity || undefined,
    alert_type: alertType || undefined,
    cameraId: cameraId || undefined,
  });

  const totalPages = Math.ceil(total / PAGE);

  return (
    <>
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-title-sm text-sm">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-1">Alerts</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Monitor and manage active traffic alerts across all zones.
          </p>
        </div>
        <a
          href={exportUrl}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-label-caps text-label-caps"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-variant rounded-lg border border-outline-variant p-1 w-fit">
        {(["active", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setOffset(0); }}
            className={`px-4 py-1.5 rounded font-label-caps text-label-caps capitalize transition-colors ${
              tab === t
                ? "bg-surface-container text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t === "active" ? `Active (${active.length})` : "History"}
          </button>
        ))}
      </div>

      {/* Filters (history only) */}
      {tab === "history" && (
        <div className="flex flex-wrap gap-3">
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setOffset(0); }}
            className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Severities</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <select
            value={alertType}
            onChange={(e) => { setAlertType(e.target.value); setOffset(0); }}
            className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Types</option>
            <option value="congestion">Congestion</option>
            <option value="stopped_traffic">Stopped Traffic</option>
            <option value="incident">Incident</option>
            <option value="manual">Manual</option>
          </select>
          <input
            value={cameraId}
            onChange={(e) => { setCameraId(e.target.value); setOffset(0); }}
            placeholder="Camera ID…"
            className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary w-40"
          />
        </div>
      )}

      {/* Active Alerts Table */}
      {tab === "active" && (
        <div className="bg-surface-container border border-white/10 rounded-xl overflow-hidden">
          {activeLoading ? (
            <div className="p-12 text-center text-on-surface-variant font-body-sm text-body-sm">
              Loading active alerts…
            </div>
          ) : active.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-emerald-400 mb-3 block">check_circle</span>
              <p className="font-body-md text-body-md text-on-surface-variant">No active alerts right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-white/10">
                    {["Severity", "Camera", "Title", "Congestion", "Triggered", "Actions"].map((h) => (
                      <th key={h} className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {active.map((alert) => (
                    <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                            SEVERITY_STYLE[alert.severity] ?? "bg-surface-variant text-on-surface-variant border-white/10"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {SEVERITY_ICON[alert.severity] ?? "info"}
                          </span>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                        {alert.cameraId}
                      </td>
                      <td className="p-4">
                        <p className="font-title-sm text-title-sm text-on-surface">{alert.title}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-xs truncate">
                          {alert.message}
                        </p>
                      </td>
                      <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                        {alert.congestionScore != null
                          ? `${(alert.congestionScore * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                      <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                        {relativeTime(alert.triggeredAt)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={acknowledging === alert.id}
                          className="px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors font-label-caps text-label-caps disabled:opacity-50"
                        >
                          {acknowledging === alert.id ? "…" : "Acknowledge"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      {tab === "history" && (
        <div className="bg-surface-container border border-white/10 rounded-xl overflow-hidden">
          {historyLoading ? (
            <div className="p-12 text-center text-on-surface-variant font-body-sm text-body-sm">
              Loading alert history…
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant font-body-sm text-body-sm">
              No alerts match the current filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-white/10">
                      {["Severity", "Type", "Camera", "Road Segment", "Title", "Triggered", "Acknowledged"].map((h) => (
                        <th key={h} className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((alert) => (
                      <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                              SEVERITY_STYLE[alert.severity] ?? "bg-surface-variant text-on-surface-variant border-white/10"
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="p-4 font-body-sm text-body-sm text-on-surface-variant capitalize">
                          {alert.type}
                        </td>
                        <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                          {alert.cameraId}
                        </td>
                        <td className="p-4 font-body-sm text-body-sm text-on-surface-variant">
                          {alert.roadSegment ?? "—"}
                        </td>
                        <td className="p-4 font-title-sm text-title-sm text-on-surface max-w-xs truncate">
                          {alert.title}
                        </td>
                        <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                          {relativeTime(alert.triggeredAt)}
                        </td>
                        <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                          {alert.acknowledgedBy ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between bg-surface-container-low">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {offset * PAGE + 1}–{Math.min((offset + 1) * PAGE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset((o) => Math.max(0, o - 1))}
                    disabled={offset === 0}
                    className="p-1 rounded text-on-surface-variant hover:bg-white/5 transition-colors disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="font-mono-data text-mono-data text-on-surface-variant text-xs">
                    {offset + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset((o) => Math.min(totalPages - 1, o + 1))}
                    disabled={offset >= totalPages - 1}
                    className="p-1 rounded text-on-surface-variant hover:bg-white/5 transition-colors disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}