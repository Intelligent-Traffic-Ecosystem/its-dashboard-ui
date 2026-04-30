"use client";

import { useState } from "react";

export default function AlertBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-error-container border-b border-error/20 px-6 py-3 flex items-center gap-3">
      <span
        className="material-symbols-outlined text-error"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        warning
      </span>
      <div>
        <p className="font-title-sm text-title-sm text-on-error-container">
          Critical Incident: Sector 4 Congestion Anomaly
        </p>
        <p className="font-body-sm text-body-sm text-on-error-container/80">
          Multiple automated reroutes failing. Manual intervention required. All
          available operators please monitor Zone C.
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-auto text-on-error-container hover:bg-white/10 p-1 rounded transition-colors"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
