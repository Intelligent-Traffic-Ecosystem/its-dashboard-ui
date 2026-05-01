"use client";

import { useState } from "react";
import GoogleMap from "@/components/maps/GoogleMap";

const LAYERS = [
  { label: "Heatmap",    active: true },
  { label: "CCTV Nodes", active: true },
  { label: "V2V Mesh",   active: false },
];

const LEGEND = [
  { color: "bg-emerald-500", label: "FLUID" },
  { color: "bg-yellow-500",  label: "DENSE" },
  { color: "bg-red-500",     label: "BLOCKED" },
];

export default function TrafficMap() {
  const [layers, setLayers] = useState(LAYERS);

  function toggleLayer(label: string) {
    setLayers((prev) =>
      prev.map((l) => (l.label === label ? { ...l, active: !l.active } : l))
    );
  }

  return (
    <div className="bg-surface-container border border-white/10 rounded overflow-hidden relative h-125">

      {/* Real Google Map fills the card */}
      <GoogleMap
        className="absolute inset-0"
        zoom={13}
        allowCustomPins={false}
      />

      {/* Layer toggles overlay */}
      <div className="absolute top-4 left-4 z-10 bg-surface-container/90 backdrop-blur-md border border-white/10 p-3 rounded-lg space-y-2">
        <h4 className="text-[11px] text-slate-400 mb-2 uppercase tracking-[0.08em] font-bold">
          LAYERS
        </h4>
        {layers.map((layer) => (
          <div
            key={layer.label}
            onClick={() => toggleLayer(layer.label)}
            className="flex items-center justify-between gap-8 cursor-pointer transition-colors hover:text-primary"
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                layer.active ? "" : "opacity-50"
              }`}
            >
              {layer.label}
            </span>
            <div
              className={`w-6 h-3 rounded-full relative transition-colors ${
                layer.active ? "bg-primary" : "bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${
                  layer.active ? "right-0.5 bg-white" : "left-0.5 bg-slate-400"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-4 right-4 z-10 bg-surface-container/80 backdrop-blur-sm border border-white/10 p-2 rounded flex gap-4">
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] font-mono-data text-white">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
