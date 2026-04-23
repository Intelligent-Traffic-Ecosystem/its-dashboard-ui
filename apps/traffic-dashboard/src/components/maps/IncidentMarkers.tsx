export default function IncidentMarkers() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* ── Critical incident marker with hover popup ── */}
      <div className="absolute top-[42%] left-[38%] pointer-events-auto cursor-pointer group">
        {/* Marker */}
        <div className="w-8 h-8 bg-error/20 border-2 border-error rounded-full flex items-center justify-center animate-pulse">
          <span
            className="material-symbols-outlined text-error text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
        </div>

        {/* Hover popup */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-[#2E4058] border border-white/10 rounded-lg shadow-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-caps text-[11px] font-bold tracking-[0.08em] uppercase bg-error/20 text-error px-2 py-0.5 rounded">
              CRITICAL INCIDENT
            </span>
            <span className="text-xs text-slate-400 font-mono-data">14:22 UTC</span>
          </div>
          <div className="font-headline-md text-base text-white mb-1 font-medium">
            M4 Junction 12 Collision
          </div>
          <div className="text-body-sm text-slate-300 mb-3">
            Vehicle pile-up affecting westbound flow. Emergency services on site.
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data text-slate-400">
            <div className="bg-black/20 p-2 rounded">
              <div className="uppercase mb-1 opacity-60">Lanes Affected</div>
              <div className="text-blue-400">3 of 4 Closed</div>
            </div>
            <div className="bg-black/20 p-2 rounded">
              <div className="uppercase mb-1 opacity-60">Delay Time</div>
              <div className="text-error">+42 Mins</div>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#2E4058]" />
        </div>
      </div>

      {/* ── Construction marker ── */}
      <div className="absolute top-[65%] left-[62%] pointer-events-auto cursor-pointer">
        <div className="w-6 h-6 bg-tertiary/20 border-2 border-tertiary rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary text-[14px]">construction</span>
        </div>
      </div>
    </div>
  );
}
