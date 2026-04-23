const drawTools = [
  { icon: "pentagon",               title: "Draw Polygon" },
  { icon: "radio_button_unchecked", title: "Draw Circle" },
  { icon: "timeline",               title: "Line String" },
];

export default function GeofenceTool() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#243447] border border-white/10 p-1 rounded shadow-2xl">
      {/* Label */}
      <div className="px-3 py-1.5 border-r border-white/10 flex items-center gap-2 mr-1">
        <span className="material-symbols-outlined text-blue-400 text-sm">edit_road</span>
        <span className="text-label-caps text-on-surface/60 text-[11px] font-bold tracking-[0.08em] uppercase">
          GEOFENCE TOOL
        </span>
      </div>

      {/* Draw buttons */}
      {drawTools.map(({ icon, title }) => (
        <button
          key={icon}
          className="p-2 hover:bg-white/10 text-white rounded transition-colors"
          title={title}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Delete */}
      <button
        className="p-2 hover:bg-white/10 text-error rounded transition-colors"
        title="Delete Selection"
      >
        <span className="material-symbols-outlined">delete</span>
      </button>

      {/* Save */}
      <button className="px-4 py-1.5 bg-blue-500 text-on-primary-container text-xs font-bold rounded hover:bg-blue-400 transition-colors ml-2">
        SAVE AREA
      </button>
    </div>
  );
}
