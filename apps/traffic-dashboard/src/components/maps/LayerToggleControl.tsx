import { Fragment } from "react";

export type MapLayerKey = "heatmap" | "incidents" | "speed" | "satellite";

interface LayerToggleControlProps {
  layers: Record<MapLayerKey, boolean>;
  onToggle: (layer: MapLayerKey) => void;
}

const layerOptions: Array<{ key: MapLayerKey; label: string }> = [
  { key: "heatmap", label: "Vehicle Heatmap" },
  { key: "incidents", label: "Incident Markers" },
  { key: "speed", label: "Speed Overlay" },
  { key: "satellite", label: "Satellite View" },
];

export default function LayerToggleControl({ layers, onToggle }: LayerToggleControlProps) {
  return (
    <div className="absolute bottom-lg right-lg z-30 w-56 bg-[#1A2636]/90 backdrop-blur-md border border-white/10 rounded shadow-xl overflow-hidden font-display-lg">
      <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
        <span className="text-xs font-bold tracking-widest text-white">MAP LAYERS</span>
        <span className="material-symbols-outlined text-slate-400 text-sm">layers</span>
      </div>

      <div className="p-3 space-y-2">
        {layerOptions.map(({ key, label }, i) => (
          <Fragment key={key}>
            {i === 3 && <div className="h-px bg-white/10 my-2" />}
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                {label}
              </span>
              <input
                checked={layers[key]}
                className="rounded border-white/20 bg-transparent accent-blue-500 focus:ring-0"
                type="checkbox"
                onChange={() => onToggle(key)}
              />
            </label>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
