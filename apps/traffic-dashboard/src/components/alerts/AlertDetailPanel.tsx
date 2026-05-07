"use client";

import type { TrafficAlert } from "@/lib/b3-backend";
import { formatAlertTime, useAcknowledgeAlert } from "@/lib/hooks/useB3Backend";

const SEVERITY_BADGE: Record<string, string> = {
  emergency: "bg-red-900/40 text-red-300 border border-red-500/20",
  critical: "bg-red-900/40 text-red-400 border border-red-500/20",
  warning: "bg-amber-900/40 text-amber-400 border border-amber-500/20",
  informational: "bg-green-900/40 text-green-400 border border-green-500/20",
};

interface AlertDetailPanelProps {
  alert: TrafficAlert | null;
  onClose: () => void;
  onAcknowledged: (alertId: string) => void;
}

export default function AlertDetailPanel({ alert, onClose, onAcknowledged }: AlertDetailPanelProps) {
  const { acknowledge, loading } = useAcknowledgeAlert();

  const handleAcknowledge = async () => {
    if (!alert) return;
    await acknowledge(alert.id);
    onAcknowledged(alert.id);
  };

  return (
    <aside className="w-[400px] bg-[#1A2636] border-l border-white/10 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="aspect-video bg-black relative group flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(76,215,246,.12),transparent_42%),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:100%_100%,36px_36px,36px_36px]" />
        <span className="material-symbols-outlined text-slate-600 text-6xl relative">videocam</span>
        <div className="absolute top-3 left-3 flex space-x-2">
          <span className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase rounded animate-pulse text-white">
            LIVE FEED
          </span>
          <span className="px-2 py-0.5 bg-black/60 text-[10px] uppercase font-mono-data rounded text-white">
            {alert?.cameraId ?? "NO_SELECTION"}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest ${SEVERITY_BADGE[alert?.severity ?? "informational"]}`}>
              {alert ? `${alert.severity} Alert` : "No Alert Selected"}
            </span>
            <h3 className="font-headline-md text-headline-md text-white mt-2">{alert?.id ?? "Select an alert"}</h3>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-outline" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Detection Source</p>
            <p className="text-body-md font-semibold text-primary">B2 YOLO / Flink</p>
          </div>
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Camera</p>
            <p className="text-body-md font-semibold text-on-surface">{alert?.cameraId ?? "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-2">Detailed Description</p>
          <p className="text-body-md text-on-surface leading-relaxed">
            {alert?.description ?? "Choose an alert from the active alert table to inspect B3 backend incident details."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Speed</p>
            <p className="text-body-md font-semibold text-on-surface">
              {alert?.details?.averageSpeedKmh?.toFixed(1) ?? "—"} km/h
            </p>
          </div>
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Congestion</p>
            <p className="text-body-md font-semibold text-on-surface">
              {alert?.details?.congestionScore?.toFixed(1) ?? "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-3 flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-1">receipt_long</span>
            Audit Trail
          </p>
          <div className="space-y-4 border-l border-white/10 ml-2 pl-4">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1A2636]" />
              <p className="text-xs font-bold text-white uppercase">Alert Triggered</p>
              <p className="text-[11px] text-outline">{alert ? formatAlertTime(alert.timestamp) : "—"} - B3 Backend</p>
            </div>
            <div className="relative opacity-60">
              <span className="absolute -left-[21px] top-1 w-2 h-2 bg-outline rounded-full border-2 border-[#1A2636]" />
              <p className="text-xs font-bold text-white uppercase">{alert?.status === "acknowledged" ? "Acknowledged" : "Waiting for Acknowledge"}</p>
              <p className="text-[11px] text-outline">{alert ? "Pending - Operator" : "No active alert selected"}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-2">Assign to Zone</p>
          <select className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none">
            <option>Select Zone Unit...</option>
            <option>Colombo Central Patrol - Unit 1</option>
            <option>Galle Road Response - Unit 5</option>
            <option>Express Emergency Services</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <button
            className="py-3 bg-surface-container-high border border-white/10 text-white rounded-lg font-bold uppercase text-xs hover:bg-surface-bright transition-colors"
            onClick={onClose}
          >
            Dismiss
          </button>
          <button
            className="py-3 bg-primary-container text-on-primary-container rounded-lg font-bold uppercase text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!alert || loading}
            onClick={handleAcknowledge}
          >
            {loading ? "Acknowledging" : "Acknowledge"}
          </button>
        </div>
      </div>
    </aside>
  );
}
