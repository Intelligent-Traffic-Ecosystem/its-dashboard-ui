"use client";

import { useMemo, useState } from "react";
import AlertFilters, { type AlertFilterState } from "@/components/alerts/AlertFilters";
import AlertTable from "@/components/alerts/AlertTable";
import AlertHistory from "@/components/alerts/AlertHistory";
import AlertDetailPanel from "@/components/alerts/AlertDetailPanel";
import { b3Backend, type TrafficAlert } from "@/lib/b3-backend";
import { useActiveAlerts, useCurrentCongestion, useAcknowledgeAlert } from "@/lib/hooks/useB3Backend";

const INITIAL_FILTERS: AlertFilterState = {
  search: "",
  severity: "",
  cameraId: "",
  date: "",
};

function matchesDate(alert: TrafficAlert, date: string) {
  if (!date) return true;
  return alert.timestamp.slice(0, 10) === date;
}

export default function AlertsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeAlert, setActiveAlert] = useState<TrafficAlert | null>(null);
  const { data: alerts, loading } = useActiveAlerts();
  const { data: metrics } = useCurrentCongestion();
  const { acknowledge, loading: acknowledging } = useAcknowledgeAlert();

  const cameras = useMemo(
    () => Array.from(new Set([...(metrics ?? []).map((metric) => metric.cameraId), ...(alerts ?? []).map((alert) => alert.cameraId)])).sort(),
    [alerts, metrics]
  );

  const filteredAlerts = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return (alerts ?? []).filter((alert) => {
      const haystack = `${alert.id} ${alert.title} ${alert.description} ${alert.cameraId}`.toLowerCase();
      return (
        (!term || haystack.includes(term)) &&
        (!filters.severity || alert.severity === filters.severity) &&
        (!filters.cameraId || alert.cameraId === filters.cameraId) &&
        matchesDate(alert, filters.date)
      );
    });
  }, [alerts, filters]);

  const historyFilters = useMemo(() => {
    const from = filters.date ? new Date(`${filters.date}T00:00:00.000Z`).toISOString() : undefined;
    const to = filters.date ? new Date(`${filters.date}T23:59:59.999Z`).toISOString() : undefined;
    return {
      cameraId: filters.cameraId || undefined,
      severity: filters.severity || undefined,
      from,
      to,
      limit: 3,
      offset: 0,
    };
  }, [filters.cameraId, filters.date, filters.severity]);

  const toggleSelected = (alertId: string) => {
    setSelectedIds((current) =>
      current.includes(alertId) ? current.filter((id) => id !== alertId) : [...current, alertId]
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) =>
      filteredAlerts.length > 0 && filteredAlerts.every((alert) => current.includes(alert.id))
        ? current.filter((id) => !filteredAlerts.some((alert) => alert.id === id))
        : Array.from(new Set([...current, ...filteredAlerts.map((alert) => alert.id)]))
    );
  };

  const acknowledgeSelected = async () => {
    for (const alertId of selectedIds) {
      await acknowledge(alertId);
    }
    setSelectedIds([]);
    if (activeAlert && selectedIds.includes(activeAlert.id)) setActiveAlert(null);
  };

  const handleAcknowledged = (alertId: string) => {
    setSelectedIds((current) => current.filter((id) => id !== alertId));
    if (activeAlert?.id === alertId) setActiveAlert(null);
  };

  const exportCsv = () => {
    window.location.href = b3Backend.alerts.getExportCsvUrl({
      ...historyFilters,
      limit: 500000,
    });
  };

  return (
    <div className="ml-64 h-[calc(100vh-3.5rem)] flex overflow-hidden">
      <section className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-display-lg text-white font-semibold tracking-[-0.02em]">
              Alert Management
            </h2>
            <p className="text-body-sm text-outline mt-1">
              Real-time B3 alert validation from B2 congestion intelligence
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              className="flex items-center px-4 py-2 bg-surface-container-high border border-white/10 rounded-lg hover:bg-surface-bright transition-colors text-body-sm font-semibold"
              onClick={exportCsv}
            >
              <span className="material-symbols-outlined mr-2 text-primary text-sm">download</span>
              Export CSV
            </button>
            <button
              className="flex items-center px-4 py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity text-body-sm font-bold uppercase tracking-tight disabled:opacity-50"
              disabled={selectedIds.length === 0 || acknowledging}
              onClick={acknowledgeSelected}
            >
              <span
                className="material-symbols-outlined mr-2 text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                done_all
              </span>
              Acknowledge Selected
            </button>
          </div>
        </div>

        <AlertFilters filters={filters} cameras={cameras} onChange={setFilters} />
        <AlertTable
          activeAlertId={activeAlert?.id}
          alerts={filteredAlerts}
          loading={loading}
          selectedIds={selectedIds}
          onSelect={setActiveAlert}
          onToggleAll={toggleAll}
          onToggleSelected={toggleSelected}
        />
        <AlertHistory filters={historyFilters} />
      </section>

      <AlertDetailPanel alert={activeAlert ?? filteredAlerts[0] ?? null} onAcknowledged={handleAcknowledged} onClose={() => setActiveAlert(null)} />
    </div>
  );
}
