"use client";

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
  { id: "flow", label: "Traffic Flow", icon: <Navigation size={14} />, defaultOn: true },
];

export const DEFAULT_ACTIVE_LAYERS = new Set(
  LAYERS.filter((l) => l.defaultOn).map((l) => l.id)
);

export interface LayerTogglesProps {
  activeLayers: Set<string>;
  onToggle: (id: string) => void;
}

export function LayerToggles({ activeLayers: active, onToggle }: LayerTogglesProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: "#757780" }}
      >
        Layers
      </p>
      <div className="flex flex-col gap-2">
        {LAYERS.map((layer) => {
          const on = active.has(layer.id);
          return (
            <button
              key={layer.id}
              onClick={() => onToggle(layer.id)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left"
              style={{
                background: on ? "rgba(59,130,246,0.08)" : "transparent",
                color: on ? "#4CD7F6" : "#757780",
                border: on ? "1px solid rgba(59,130,246,0.20)" : "1px solid transparent",
                fontFamily: "var(--font-inter)",
              }}
            >
              {layer.icon}
              {layer.label}
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                style={{
                  background: on ? "rgba(76,215,246,0.15)" : "rgba(255,255,255,0.06)",
                  color: on ? "#4CD7F6" : "#757780",
                }}
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
