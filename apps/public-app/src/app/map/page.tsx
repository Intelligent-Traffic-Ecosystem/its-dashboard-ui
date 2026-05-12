"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { CameraPopup } from "@/components/map/CameraPopup";
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
  const [selectedLocation, setSelectedLocation] = useState<Incident | null>(null);

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
      subtitle="Geospatial view of camera locations and congestion heatmap"
      actions={<LiveIndicator />}
    >
      <div className="flex flex-col gap-4 md:flex-row md:h-[calc(100vh-10rem)]">
        {/* Map — first on mobile, second (right) on desktop */}
        <div className="order-1 md:order-2 relative flex-1 min-h-[58vw] sm:min-h-[420px] md:min-h-0">
          <MapView
            className="h-full"
            activeLayers={activeLayers}
            onSelectLocation={setSelectedLocation}
          />
          <CameraPopup
            location={selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        </div>

        {/* Controls — second on mobile (below map), first (left sidebar) on desktop */}
        <div className="order-2 md:order-1 grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-52 md:shrink-0 md:flex-col">
          <div className="min-w-0">
            <LayerToggles activeLayers={activeLayers} onToggle={onToggleLayer} />
          </div>
          <div className="min-w-0">
            <MapLegend />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
