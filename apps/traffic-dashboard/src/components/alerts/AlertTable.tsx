"use client";

import type { TrafficAlert } from "@/lib/b3-backend";
import { formatAlertTime } from "@/lib/hooks/useB3Backend";

const headers = ["", "Status", "Severity", "ID", "Timestamp", "Type", "Location", "Actions"];

const SEVERITY_STYLE: Record<string, {
  severityBadge: string;
  rowBg: string;
  borderColor: string;
  icon: string;
  iconClass: string;
  iconFill: boolean;
  label: string;
}> = {
  emergency: {
    severityBadge: "bg-red-900/40 text-red-300 border border-red-500/20",
    rowBg: "bg-red-500/5 hover:bg-red-500/10",
    borderColor: "border-l-red-500",
    icon: "emergency",
    iconClass: "text-red-500 animate-pulse",
    iconFill: true,
    label: "Emergency",
  },
  critical: {
    severityBadge: "bg-red-900/40 text-red-400 border border-red-500/20",
    rowBg: "bg-red-500/5 hover:bg-red-500/10",
    borderColor: "border-l-red-500",
    icon: "error",
    iconClass: "text-red-500 animate-pulse",
    iconFill: true,
    label: "Critical",
  },
  warning: {
    severityBadge: "bg-amber-900/40 text-amber-400 border border-amber-500/20",
    rowBg: "hover:bg-white/5",
    borderColor: "border-l-amber-500",
    icon: "warning",
    iconClass: "text-amber-500",
    iconFill: false,
    label: "Warning",
  },
  informational: {
    severityBadge: "bg-green-900/40 text-green-400 border border-green-500/20",
    rowBg: "hover:bg-white/5",
    borderColor: "border-l-green-500",
    icon: "info",
    iconClass: "text-green-500",
    iconFill: true,
    label: "Info",
  },
};

interface AlertTableProps {
  alerts: TrafficAlert[];
  selectedIds: string[];
  activeAlertId?: string;
  loading?: boolean;
  onSelect: (alert: TrafficAlert) => void;
  onToggleSelected: (alertId: string) => void;
  onToggleAll: () => void;
}

export default function AlertTable({
  alerts,
  selectedIds,
  activeAlertId,
  loading = false,
  onSelect,
  onToggleSelected,
  onToggleAll,
}: AlertTableProps) {
  const allSelected = alerts.length > 0 && alerts.every((alert) => selectedIds.includes(alert.id));

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900/50 text-label-caps text-outline uppercase border-b border-white/5">
            <th className="p-4 w-10">
              <input
                checked={allSelected}
                className="rounded bg-surface-container-lowest border-white/20 accent-primary"
                type="checkbox"
                onChange={onToggleAll}
              />
            </th>
            {headers.slice(1).map((h) => (
              <th key={h} className="p-4 text-[11px] font-bold tracking-[0.08em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {loading && (
            <tr>
              <td className="p-6 text-center text-outline" colSpan={headers.length}>Loading active alerts...</td>
            </tr>
          )}

          {!loading && alerts.length === 0 && (
            <tr>
              <td className="p-6 text-center text-outline" colSpan={headers.length}>No active alerts match the selected filters.</td>
            </tr>
          )}

          {alerts.map((alert) => {
            const style = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.informational;
            const selected = selectedIds.includes(alert.id);
            return (
              <tr
                key={alert.id}
                className={`border-l-4 transition-all cursor-pointer ${style.borderColor} ${style.rowBg} ${activeAlertId === alert.id ? "bg-white/5" : ""}`}
                onClick={() => onSelect(alert)}
              >
                <td className="p-4" onClick={(event) => event.stopPropagation()}>
                  <input
                    checked={selected}
                    className="rounded bg-surface-container-lowest border-white/20 accent-primary"
                    type="checkbox"
                    onChange={() => onToggleSelected(alert.id)}
                  />
                </td>
                <td className="p-4">
                  <span
                    className={`material-symbols-outlined ${style.iconClass}`}
                    style={style.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {style.icon}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider ${style.severityBadge}`}>
                    {style.label}
                  </span>
                </td>
                <td className="p-4 font-mono-data text-white">{alert.id}</td>
                <td className="p-4 text-body-sm text-on-surface-variant">{formatAlertTime(alert.timestamp)}</td>
                <td className="p-4 text-body-sm font-semibold text-on-surface">{alert.title}</td>
                <td className="p-4 text-body-sm text-on-surface-variant">{alert.cameraId}</td>
                <td className="p-4">
                  <button className="text-primary hover:underline text-xs font-bold uppercase">
                    Details
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
