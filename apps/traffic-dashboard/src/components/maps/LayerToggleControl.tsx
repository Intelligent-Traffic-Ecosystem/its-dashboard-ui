const layers = [
  { label: "Vehicle Heatmap",   defaultChecked: true },
  { label: "Incident Markers",  defaultChecked: true },
  { label: "Speed Overlay",     defaultChecked: true },
  { label: "Satellite View",    defaultChecked: false },
];

export default function LayerToggleControl() {
  return (
    <div className="absolute bottom-lg right-lg z-30 w-56 bg-[#1A2636]/90 backdrop-blur-md border border-white/10 rounded shadow-xl overflow-hidden font-display-lg">
      {/* Header */}
      <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest text-white">MAP LAYERS</span>
        <span className="material-symbols-outlined text-slate-400 text-sm">layers</span>
      </div>

      {/* Toggles */}
      <div className="p-3 space-y-2">
        {layers.map(({ label, defaultChecked }, i) => (
          <>
            {i === 3 && <div key="divider" className="h-px bg-white/10 my-2" />}
            <label key={label} className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {label}
              </span>
              <input
                defaultChecked={defaultChecked}
                className="rounded border-white/20 bg-transparent accent-blue-500 focus:ring-0"
                type="checkbox"
              />
            </label>
          </>
        ))}
      </div>
    </div>
  );
}
