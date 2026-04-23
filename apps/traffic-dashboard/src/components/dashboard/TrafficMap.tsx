const layers = [
  { label: "Heatmap",    active: true },
  { label: "CCTV Nodes", active: true },
  { label: "V2V Mesh",   active: false },
];

const legend = [
  { color: "bg-emerald-500", label: "FLUID" },
  { color: "bg-yellow-500",  label: "DENSE" },
  { color: "bg-red-500",     label: "BLOCKED" },
];

export default function TrafficMap() {
  return (
    <div className="bg-surface-container border border-white/10 rounded overflow-hidden relative h-[500px]">
      {/* Map background */}
      <div className="absolute inset-0 bg-slate-900">
        <img
          className="w-full h-full object-cover opacity-60"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4NMO0UqR72ak4rx6IAsNh6l98pSYKNl7XerLcTzMHovfOr3vpy9mvImKpLCm4DtpNJKyTlaJOMvWT406R0rKjPa2SO0Aznj2obzmK4EC7EYKnlrylWnZ0KZiBos0m6LldWnBW-ic4UEDWEaoEsklX33wFn6Lu5SaS1Ae8oJajyan0i54I0LlhAv2ZVIZit2LWzUBrfLPQBnz4iFDScojf2NbziqEJJQoXPQ5FvkM_YeX0Kgcsw3Jmx0SfLeYt6D-SaWPBKPkxlPE"
          alt="Traffic map"
        />
        {/* Heatmap overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-error/5" />

        {/* Incident marker */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 group">
          <div className="w-8 h-8 bg-error-container border-2 border-white rounded-full flex items-center justify-center animate-bounce shadow-2xl">
            <span
              className="material-symbols-outlined text-white text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              car_crash
            </span>
          </div>
          <div className="hidden group-hover:block absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface-container-highest border border-white/10 p-2 rounded shadow-2xl w-48 z-10">
            <p className="text-[10px] font-bold text-error uppercase">Critical Collision</p>
            <p className="text-[10px] text-white">I-95 North. Impact Level 4.</p>
          </div>
        </div>
      </div>

      {/* Layer toggles */}
      <div className="absolute top-4 left-4 bg-[#1d2027]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg space-y-2">
        <h4 className="text-[11px] text-slate-400 mb-2 uppercase tracking-[0.08em] font-bold">LAYERS</h4>
        {layers.map((layer) => (
          <div
            key={layer.label}
            className={`flex items-center justify-between gap-8 cursor-pointer transition-colors ${
              layer.active ? "hover:text-primary" : "hover:text-slate-300"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                layer.active ? "" : "opacity-50"
              }`}
            >
              {layer.label}
            </span>
            <div
              className={`w-6 h-3 rounded-full relative ${
                layer.active ? "bg-primary" : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-2 h-2 rounded-full ${
                  layer.active ? "right-0.5 bg-white" : "left-0.5 bg-slate-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-surface-container/80 backdrop-blur-sm border border-white/10 p-2 rounded flex gap-4">
        {legend.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] font-mono-data text-white">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
