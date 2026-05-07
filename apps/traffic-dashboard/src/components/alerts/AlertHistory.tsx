"use client";

import { useAlertHistory, formatAlertTime } from "@/lib/hooks/useB3Backend";

export default function AlertHistory() {
  const { data: alertHistory, loading, error } = useAlertHistory(undefined, 3, 0);

  if (loading) {
    return (
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
            <span className="material-symbols-outlined mr-2 text-outline">history</span>
            Recent History (Past 2 Hours)
          </h3>
          <a href="/alerts" className="text-primary text-xs font-bold uppercase hover:opacity-80">
            View Full Archive
          </a>
        </div>
        <div className="text-center text-outline">Loading alert history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
            <span className="material-symbols-outlined mr-2 text-outline">history</span>
            Recent History (Past 2 Hours)
          </h3>
        </div>
        <div className="text-center text-error">Failed to load alert history</div>
      </div>
    );
  }

  const history = alertHistory?.items.slice(0, 3) || [];

  if (history.length === 0) {
    return (
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
            <span className="material-symbols-outlined mr-2 text-outline">history</span>
            Recent History (Past 2 Hours)
          </h3>
          <a href="/alerts" className="text-primary text-xs font-bold uppercase hover:opacity-80">
            View Full Archive
          </a>
        </div>
        <div className="text-center text-outline py-4">No alert history available</div>
      </div>
    );
  }

  return (
    <div className="border-t border-white/10 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
          <span className="material-symbols-outlined mr-2 text-outline">history</span>
          Recent History (Past 2 Hours)
        </h3>
        <a href="/alerts" className="text-primary text-xs font-bold uppercase hover:opacity-80">
          View Full Archive
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.alertId}
            className="p-4 bg-surface-container border border-white/5 rounded-lg flex items-start space-x-3"
          >
            <span className="material-symbols-outlined flex-shrink-0 text-green-500">
              check_circle
            </span>
            <div>
              <p className="text-xs font-bold text-white uppercase">{item.alertId}</p>
              <p className="text-[11px] text-outline">Acknowledged alert</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono-data">
                {item.acknowledgedBy} @ {formatAlertTime(item.acknowledgedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
