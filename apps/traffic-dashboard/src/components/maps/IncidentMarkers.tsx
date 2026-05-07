"use client";

import { useMapIncidents } from "@/lib/hooks/useB3Backend";

const DEFAULT_CENTER = { lat: 6.0358656, lng: 80.2291712 };

const SEVERITY_STYLE: Record<string, { ring: string; badge: string; icon: string; label: string }> = {
  emergency: {
    ring: "bg-error/20 border-error text-error animate-pulse",
    badge: "bg-error/20 text-error",
    icon: "emergency",
    label: "EMERGENCY INCIDENT",
  },
  critical: {
    ring: "bg-error/20 border-error text-error animate-pulse",
    badge: "bg-error/20 text-error",
    icon: "warning",
    label: "CRITICAL INCIDENT",
  },
  warning: {
    ring: "bg-tertiary/20 border-tertiary text-tertiary",
    badge: "bg-tertiary/20 text-tertiary",
    icon: "warning",
    label: "WARNING INCIDENT",
  },
  informational: {
    ring: "bg-primary/20 border-primary text-primary",
    badge: "bg-primary/20 text-primary",
    icon: "info",
    label: "TRAFFIC INCIDENT",
  },
};

function timeLabel(timestamp?: string) {
  if (!timestamp) return "—";
  try {
    return new Date(timestamp).toISOString().slice(11, 16) + " UTC";
  } catch {
    return "—";
  }
}

function project(lat?: number, lng?: number) {
  const safeLat = lat ?? DEFAULT_CENTER.lat;
  const safeLng = lng ?? DEFAULT_CENTER.lng;
  const left = ((safeLng - 80.18) / 0.1) * 84 + 8;
  const top = (1 - (safeLat - 5.99) / 0.09) * 74 + 10;

  return {
    left: `${Math.max(8, Math.min(92, left))}%`,
    top: `${Math.max(10, Math.min(84, top))}%`,
  };
}

export default function IncidentMarkers() {
  const { data: incidents } = useMapIncidents();

  if (!incidents?.length) {
    return <div className="absolute inset-0 z-10 pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {incidents.map((incident) => {
        const id = incident.alertId ?? incident.alert_id ?? `${incident.cameraId ?? incident.camera_id}-${incident.timestamp}`;
        const lat = incident.lat ?? incident.latitude;
        const lng = incident.lng ?? incident.longitude;
        const position = project(lat, lng);
        const severity = String(incident.severity || "informational").toLowerCase();
        const style = SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.informational;
        const timestamp = incident.timestamp ?? incident.triggered_at;

        return (
          <div
            key={id}
            className="absolute pointer-events-auto cursor-pointer group"
            style={position}
          >
            <div className={`w-8 h-8 border-2 rounded-full flex items-center justify-center ${style.ring}`}>
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {style.icon}
              </span>
            </div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-[#2E4058] border border-white/10 rounded-lg shadow-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-label-caps text-[11px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded ${style.badge}`}>
                  {style.label}
                </span>
                <span className="text-xs text-slate-400 font-mono-data">{timeLabel(timestamp)}</span>
              </div>
              <div className="font-headline-md text-base text-white mb-1 font-medium">
                {incident.title}
              </div>
              <div className="text-body-sm text-slate-300 mb-3">
                {incident.message ?? incident.alertType ?? incident.alert_type ?? "Active traffic event"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data text-slate-400">
                <div className="bg-black/20 p-2 rounded">
                  <div className="uppercase mb-1 opacity-60">Camera</div>
                  <div className="text-blue-400">{incident.cameraId ?? incident.camera_id ?? "—"}</div>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <div className="uppercase mb-1 opacity-60">Type</div>
                  <div className="text-error">{incident.alertType ?? incident.alert_type ?? "congestion"}</div>
                </div>
              </div>
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#2E4058]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
