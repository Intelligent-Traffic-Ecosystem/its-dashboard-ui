"use client";

import { useState } from "react";
import { Flame, MapPin, Navigation } from "lucide-react";

interface Layer {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultOn: boolean;
}

const LAYERS: Layer[] = [
  { id: "heatmap", label: "Congestion Heatmap", icon: <Flame size={14} />, defaultOn: true },
  { id: "incidents", label: "Incident Markers", icon: <MapPin size={14} />, defaultOn: true },
  { id: "flow", label: "Traffic Flow", icon: <Navigation size={14} />, defaultOn: false },
];

export function LayerToggles() {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(LAYERS.filter((l) => l.defaultOn).map((l) => l.id))
  );

  const toggle = (id: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
        Layers
      </p>
      <div className="flex flex-col gap-2">
        {LAYERS.map((layer) => {
          const on = active.has(layer.id);
          return (
            <button
              key={layer.id}
              onClick={() => toggle(layer.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                on
                  ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {layer.icon}
              {layer.label}
              <span
                className={`ml-auto text-xs px-1.5 py-0.5 rounded font-medium ${
                  on
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {on ? "ON" : "OFF"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
