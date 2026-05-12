"use client";

import { useAlertHistory, formatAlertTime } from "@/lib/hooks/useB3Backend";
import type { AlertHistoryFilters } from "@/lib/b3-backend";

const SEVERITY_BADGE: Record<string, string> = {
  emergency: "bg-red-900/40 text-red-300 border border-red-500/20",
  critical: "bg-red-900/40 text-red-400 border border-red-500/20",
  warning: "bg-amber-900/40 text-amber-400 border border-amber-500/20",
  informational: "bg-green-900/40 text-green-400 border border-green-500/20",
};

interface AlertHistoryProps {
  filters?: AlertHistoryFilters;
}

export default function AlertHistory({ filters }: AlertHistoryProps) {
  const { data: alertHistory, loading, error } = useAlertHistory(filters ?? { limit: 3, offset: 0 });

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
        <span className="material-symbols-outlined mr-2 text-outline">history</span>
        Recent Acknowledged (Past 2 Hours)
      </h3>
      <a href="/alerts/archive" className="text-primary text-xs font-bold uppercase hover:opacity-80">
        View Full Archive
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className="border-t border-white/10 pt-6">
        {header}
        <div className="text-center text-outline">Loading alert history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-white/10 pt-6">
        {header}
        <div className="text-center text-error">Failed to load alert history</div>
      </div>
    );
  }

  const history = alertHistory?.items.slice(0, 3) || [];

  if (history.length === 0) {
    return (
      <div className="border-t border-white/10 pt-6">
        {header}
        <div className="text-center text-outline py-4">No acknowledged alerts yet</div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-6">
      {header}

      <div className="grid grid-cols-3 gap-4">
        {history.map((item) => {
          const sev = item.severity ?? "informational";
          return (
            <div
              key={item.alertId}
              className="p-4 bg-surface-container border border-white/5 rounded-lg flex items-start space-x-3"
            >
              <span
                className="material-symbols-outlined shrink-0 text-green-500 mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider shrink-0 ${SEVERITY_BADGE[sev]}`}>
                    {sev}
                  </span>
                  <p className="text-xs font-mono-data text-white truncate">#{item.alertId}</p>
                </div>
                <p className="text-[11px] font-semibold text-on-surface truncate" title={item.title}>
                  {item.title ?? "Alert acknowledged"}
                </p>
                <p className="text-[10px] text-outline truncate">
                  {item.cameraId ?? "—"}{item.roadSegment ? ` · ${item.roadSegment}` : ""}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono-data">
                  {item.acknowledgedBy} @ {formatAlertTime(item.acknowledgedAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
