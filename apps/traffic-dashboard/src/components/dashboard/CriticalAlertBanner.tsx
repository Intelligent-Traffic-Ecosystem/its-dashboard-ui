"use client";

import { useEffect, useState } from "react";
import { getSocket, type TrafficAlert } from "@/lib/socket";

export default function CriticalAlertBanner() {
  const [alert, setAlert] = useState<TrafficAlert | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onAlert = (data: TrafficAlert) => {
      if (data.severity === "critical" || data.severity === "emergency") {
        setAlert(data);
        setDismissed(null);
      }
    };

    socket.on("alert:new", onAlert);
    return () => { socket.off("alert:new", onAlert); };
  }, []);

  if (!alert || alert.id === dismissed) return null;

  return (
    <div className="critical-pulse border border-error/20 rounded-lg p-4 flex items-center justify-between shadow-xl">
      <div className="flex items-center gap-4">
        <span
          className="material-symbols-outlined text-white text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
        <div>
          <h2 className="font-headline-md text-white uppercase tracking-widest text-sm font-bold">
            {alert.title}
          </h2>
          <p className="text-xs text-white/80 font-body-sm">{alert.description}</p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(alert.id)}
        className="bg-white text-error-container font-headline-md text-xs font-bold py-2 px-6 rounded uppercase hover:bg-white/90 active:opacity-80 transition-all shrink-0"
      >
        Acknowledge
      </button>
    </div>
  );
}
