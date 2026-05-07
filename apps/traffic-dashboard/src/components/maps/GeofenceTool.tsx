export type DrawTool = "polygon" | "circle" | "line";

interface GeofenceToolProps {
  activeTool: DrawTool | null;
  canSave: boolean;
  draftCount: number;
  savedCount: number;
  onDelete: () => void;
  onSave: () => void;
  onSelectTool: (tool: DrawTool) => void;
}

const drawTools: Array<{ key: DrawTool; icon: string; title: string }> = [
  { key: "polygon", icon: "pentagon", title: "Draw Polygon" },
  { key: "circle", icon: "radio_button_unchecked", title: "Draw Circle" },
  { key: "line", icon: "timeline", title: "Line String" },
];

export default function GeofenceTool({
  activeTool,
  canSave,
  draftCount,
  savedCount,
  onDelete,
  onSave,
  onSelectTool,
}: GeofenceToolProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#243447] border border-white/10 p-1 rounded shadow-2xl">
      <div className="px-3 py-1.5 border-r border-white/10 flex items-center gap-2 mr-1">
        <span className="material-symbols-outlined text-blue-400 text-sm">edit_road</span>
        <span className="text-label-caps text-on-surface/60 text-[11px] font-bold tracking-[0.08em] uppercase">
          GEOFENCE TOOL
        </span>
      </div>

      {drawTools.map(({ key, icon, title }) => (
        <button
          key={key}
          className={`p-2 hover:bg-white/10 text-white rounded transition-colors ${activeTool === key ? "bg-blue-500/30 text-blue-300" : ""}`}
          title={title}
          onClick={() => onSelectTool(key)}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </button>
      ))}

      <div className="w-px h-6 bg-white/10 mx-1" />

      <button
        className="p-2 hover:bg-white/10 text-error rounded transition-colors"
        title="Delete Selection"
        onClick={onDelete}
      >
        <span className="material-symbols-outlined">delete</span>
      </button>

      <div className="px-2 text-[10px] font-mono-data text-slate-500 uppercase">
        {draftCount ? `${draftCount} pts` : `${savedCount} saved`}
      </div>

      <button
        className={`px-4 py-1.5 text-on-primary-container text-xs font-bold rounded transition-colors ml-2 ${canSave ? "bg-blue-500 hover:bg-blue-400" : "bg-slate-700 text-slate-400 cursor-not-allowed"}`}
        disabled={!canSave}
        onClick={onSave}
      >
        SAVE AREA
      </button>
    </div>
  );
}
