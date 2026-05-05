"use client";

export default function CriticalAlertBanner() {
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
            CRITICAL INCIDENT: MULTI-VEHICLE COLLISION – I-95 NORTHBOUND
          </h2>
          <p className="text-xs text-white/80 font-body-sm">
            Confirmed: 3 units involved. Lanes 1 &amp; 2 blocked. ETA for response teams: 4 mins.
          </p>
        </div>
      </div>
      <button className="bg-white text-error-container font-headline-md text-xs font-bold py-2 px-6 rounded uppercase hover:bg-white/90 active:opacity-80 transition-all shrink-0">
        Acknowledge
      </button>
    </div>
  );
}
