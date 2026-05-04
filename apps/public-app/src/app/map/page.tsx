"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { IncidentPopup } from "@/components/map/IncidentPopup";
import { DEFAULT_ACTIVE_LAYERS, LayerToggles } from "@/components/map/LayerToggles";
import { MapLegend } from "@/components/map/MapLegend";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import type { Incident } from "@/lib/types";

const MapView = dynamic(
  () => import("@/components/map/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> }
);

function MapLoadingPlaceholder() {
  return (
    <div
      className="flex flex-1 min-h-[320px] animate-pulse items-center justify-center rounded-xl sm:min-h-[500px]"
      style={{ background: "#0A0E1A", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p className="text-sm" style={{ color: "#757780" }}>
        Loading map…
      </p>
    </div>
  );
}

export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(() => new Set(DEFAULT_ACTIVE_LAYERS));
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const onToggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <PageShell
      title="Live Traffic Map"
      subtitle="Geospatial view of active incidents and congestion heatmap"
      actions={<LiveIndicator />}
    >
      <div className="flex flex-col gap-4 md:flex-row md:h-[calc(100vh-10rem)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-52 md:shrink-0 md:flex-col">
          <div className="min-w-0">
            <LayerToggles activeLayers={activeLayers} onToggle={onToggleLayer} />
          </div>
          <div className="min-w-0">
            <MapLegend />
          </div>
        </div>

        <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] md:min-h-0">
          <MapView
            className="h-full"
            activeLayers={activeLayers}
            onSelectIncident={setSelectedIncident}
          />
          <IncidentPopup incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
        </div>
      </div>
    </PageShell>
  );
}
