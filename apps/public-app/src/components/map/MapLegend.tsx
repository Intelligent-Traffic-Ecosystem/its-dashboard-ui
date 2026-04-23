const LEGEND_ITEMS = [
  { label: "Free flow", color: "bg-emerald-500", range: "< 40%" },
  { label: "Moderate", color: "bg-yellow-500", range: "40–60%" },
  { label: "Heavy", color: "bg-orange-500", range: "60–80%" },
  { label: "Standstill", color: "bg-red-500", range: "> 80%" },
];

export function MapLegend() {
  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
        Congestion
      </p>
      <div className="flex flex-col gap-2">
        {LEGEND_ITEMS.map(({ label, color, range }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className={`size-3 rounded-sm shrink-0 ${color}`} />
            <span className="text-sm text-zinc-300">{label}</span>
            <span className="ml-auto text-xs text-zinc-600 tabular-nums">
              {range}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
          Incident markers
        </p>
        {[
          { dot: "bg-red-500", label: "Critical / Active" },
          { dot: "bg-orange-500", label: "High severity" },
          { dot: "bg-yellow-500", label: "Medium / Monitoring" },
          { dot: "bg-blue-500", label: "Low / Roadwork" },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-2.5 mb-1.5">
            <span className={`size-2.5 rounded-full shrink-0 ${dot}`} />
            <span className="text-xs text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
