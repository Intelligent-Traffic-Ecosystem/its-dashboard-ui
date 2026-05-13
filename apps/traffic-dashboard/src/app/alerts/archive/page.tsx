"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AlertHistoryFilters } from "@/lib/b3-backend";
import { b3Backend } from "@/lib/b3-backend";
import { formatAlertTime, useAlertHistory, useCurrentCongestion } from "@/lib/hooks/useB3Backend";

const PAGE_SIZE = 25;

const SEVERITY_BADGE: Record<string, string> = {
  emergency: "bg-red-900/40 text-red-300 border border-red-500/20",
  critical: "bg-red-900/40 text-red-400 border border-red-500/20",
  warning: "bg-amber-900/40 text-amber-400 border border-amber-500/20",
  informational: "bg-green-900/40 text-green-400 border border-green-500/20",
};

function dateBounds(date: string) {
  if (!date) return { from: undefined, to: undefined };
  return {
    from: new Date(`${date}T00:00:00.000Z`).toISOString(),
    to: new Date(`${date}T23:59:59.999Z`).toISOString(),
  };
}

export default function AlertArchivePage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [date, setDate] = useState("");
  const [offset, setOffset] = useState(0);
  const { data: metrics } = useCurrentCongestion();

  const cameras = useMemo(
    () => Array.from(new Set((metrics ?? []).map((metric) => metric.cameraId))).sort(),
    [metrics]
  );

  const filters: AlertHistoryFilters = useMemo(() => {
    const { from, to } = dateBounds(date);
    return {
      cameraId: cameraId || undefined,
      severity: severity || undefined,
      from,
      to,
      limit: PAGE_SIZE,
      offset,
    };
  }, [cameraId, date, offset, severity]);

  const { data: history, loading, error } = useAlertHistory(filters);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = history?.items ?? [];
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [
        item.alertId,
        item.title,
        item.cameraId,
        item.roadSegment,
        item.severity,
        item.acknowledgedBy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [history, search]);

  const total = history?.pagination.total ?? 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = (update: () => void) => {
    update();
    setOffset(0);
  };

  const exportCsv = () => {
    window.location.href = b3Backend.alerts.getExportCsvUrl({
      cameraId: cameraId || undefined,
      severity: severity || undefined,
      ...dateBounds(date),
      limit: 500000,
    });
  };

  return (
    <main className="ml-64 p-margin pt-sm min-h-[calc(100vh-3.5rem)]">
      <header className="flex items-end justify-between gap-lg mb-lg flex-wrap">
        <div>
          <Link href="/alerts" className="text-xs font-bold uppercase text-primary hover:opacity-80">
            Back to alerts
          </Link>
          <h1 className="font-display-lg text-display-lg text-on-surface font-semibold tracking-[-0.02em] mt-2">
            Alert Archive
          </h1>
          <p className="text-on-surface-variant text-body-sm">
            Acknowledged B2 congestion alerts with operator audit details.
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-surface-container-high border border-white/10 rounded-lg hover:bg-surface-bright transition-colors text-body-sm font-semibold"
          onClick={exportCsv}
        >
          <span className="material-symbols-outlined mr-2 text-primary text-sm">download</span>
          Export CSV
        </button>
      </header>

      <section className="grid grid-cols-12 gap-4 bg-surface-container-low p-4 rounded-xl border border-white/5 mb-lg">
        <div className="col-span-12 lg:col-span-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg pl-10 pr-4 py-2 text-body-md text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            placeholder="Search archive"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="col-span-12 sm:col-span-4 lg:col-span-2">
          <select
            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
            value={severity}
            onChange={(event) => resetPage(() => setSeverity(event.target.value))}
          >
            <option value="">Severity: All</option>
            <option value="emergency">Emergency</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="informational">Informational</option>
          </select>
        </div>
        <div className="col-span-12 sm:col-span-4 lg:col-span-3">
          <select
            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
            value={cameraId}
            onChange={(event) => resetPage(() => setCameraId(event.target.value))}
          >
            <option value="">Camera: All</option>
            {cameras.map((camera) => (
              <option key={camera} value={camera}>{camera}</option>
            ))}
          </select>
        </div>
        <div className="col-span-12 sm:col-span-4 lg:col-span-3">
          <input
            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
            type="date"
            value={date}
            onChange={(event) => resetPage(() => setDate(event.target.value))}
          />
        </div>
      </section>

      <section className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-label-caps text-outline uppercase border-b border-white/5">
                {["Severity", "Alert ID", "Triggered", "Title", "Camera", "Acknowledged By", "Acknowledged At"].map((heading) => (
                  <th key={heading} className="p-4 text-[11px] font-bold tracking-[0.08em]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td className="p-6 text-center text-outline" colSpan={7}>Loading archive...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td className="p-6 text-center text-error" colSpan={7}>Failed to load archive</td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-outline" colSpan={7}>No archived alerts match the selected filters.</td>
                </tr>
              )}
              {!loading && !error && rows.map((item) => {
                const sev = item.severity ?? "informational";
                return (
                  <tr key={item.alertId} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider ${SEVERITY_BADGE[sev] ?? SEVERITY_BADGE.informational}`}>
                        {sev}
                      </span>
                    </td>
                    <td className="p-4 font-mono-data text-white">#{item.alertId}</td>
                    <td className="p-4 text-body-sm text-on-surface-variant">{formatAlertTime(item.triggeredAt ?? "")}</td>
                    <td className="p-4 text-body-sm font-semibold text-on-surface">{item.title ?? "Alert acknowledged"}</td>
                    <td className="p-4 text-body-sm text-on-surface-variant">
                      {item.cameraId ?? "—"}{item.roadSegment ? ` · ${item.roadSegment}` : ""}
                    </td>
                    <td className="p-4 text-body-sm text-on-surface">{item.acknowledgedBy}</td>
                    <td className="p-4 text-body-sm text-on-surface-variant">{formatAlertTime(item.acknowledgedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-md border-t border-white/5 px-4 py-3">
          <span className="text-xs text-outline">
            Page {currentPage} of {totalPages} · {total.toLocaleString()} archived alerts
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase text-on-surface disabled:opacity-40"
              disabled={offset === 0 || loading}
              onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold uppercase text-on-surface disabled:opacity-40"
              disabled={!history?.pagination.hasMore || loading}
              onClick={() => setOffset((value) => value + PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
