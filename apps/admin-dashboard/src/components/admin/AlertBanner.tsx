"use client";

import { useEffect, useState } from "react";
import { getActiveAlerts, type Alert } from "@/lib/backend";

export default function AlertBanner() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const alerts = await getActiveAlerts();
        const top = alerts.find(
          (a) => a.severity === "EMERGENCY" || a.severity === "CRITICAL"
        ) ?? null;
        setAlert(top);
      } catch {
        setAlert(null);
      }
    }
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!alert || alert.id === dismissed) return null;

  const isEmergency = alert.severity === "EMERGENCY";

  return (
    <div
      className={`border-b px-6 py-3 flex items-center gap-3 ${
        isEmergency
          ? "bg-error-container border-error/20"
          : "bg-tertiary/10 border-tertiary/20"
      }`}
    >
      <span
        className={`material-symbols-outlined ${isEmergency ? "text-error" : "text-tertiary"}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {isEmergency ? "crisis_alert" : "warning"}
      </span>
      <div>
        <p className={`font-title-sm text-title-sm ${isEmergency ? "text-on-error-container" : "text-on-surface"}`}>
          {alert.severity}: {alert.title}
        </p>
        <p className={`font-body-sm text-body-sm ${isEmergency ? "text-on-error-container/80" : "text-on-surface-variant"}`}>
          {alert.message} — Camera {alert.cameraId}
          {alert.roadSegment ? ` · ${alert.roadSegment}` : ""}
        </p>
      </div>
      <button
        onClick={() => setDismissed(alert.id)}
        className={`ml-auto p-1 rounded transition-colors ${
          isEmergency
            ? "text-on-error-container hover:bg-white/10"
            : "text-on-surface-variant hover:bg-white/10"
        }`}
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}