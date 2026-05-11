"use client";

import { Flame, Navigation } from "lucide-react";

interface Layer {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultOn: boolean;
}

const LAYERS: Layer[] = [
  { id: "heatmap", label: "Congestion Heatmap", icon: <Flame size={14} />, defaultOn: true },
  { id: "flow", label: "Camera Locations", icon: <Navigation size={14} />, defaultOn: true },
];

export const DEFAULT_ACTIVE_LAYERS = new Set(
  LAYERS.filter((l) => l.defaultOn).map((l) => l.id)
);

export interface LayerTogglesProps {
  activeLayers: Set<string>;
  onToggle: (id: string) => void;
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div
      className="relative ml-auto shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: 36,
        height: 20,
        background: on ? "rgba(76,215,246,0.35)" : "rgba(255,255,255,0.10)",
        border: on ? "1px solid rgba(76,215,246,0.4)" : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        className="absolute top-[2px] size-[14px] rounded-full transition-all duration-200 shadow-sm"
        style={{
          background: on ? "#4CD7F6" : "#757780",
          left: on ? 18 : 2,
          boxShadow: on ? "0 0 6px #4CD7F688" : "none",
        }}
      />
    </div>
  );
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
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left"
              style={{
                background: on ? "rgba(59,130,246,0.08)" : "transparent",
                color: on ? "#4CD7F6" : "#757780",
                border: on ? "1px solid rgba(59,130,246,0.18)" : "1px solid transparent",
                fontFamily: "var(--font-inter)",
              }}
            >
              <span className="shrink-0" style={{ color: on ? "#4CD7F6" : "#757780" }}>
                {layer.icon}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-tight">{layer.label}</span>
              <ToggleSwitch on={on} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
