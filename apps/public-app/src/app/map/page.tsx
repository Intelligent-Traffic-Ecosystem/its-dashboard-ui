import { PageShell } from "@/components/layout/PageShell";
import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { LayerToggles } from "@/components/map/LayerToggles";
import { MapLegend } from "@/components/map/MapLegend";
import { IncidentPopup } from "@/components/map/IncidentPopup";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

export default function MapPage() {
  return (
    <PageShell
      title="Live Map"
      subtitle="Geospatial view of active incidents and congestion heatmap"
      actions={<LiveIndicator />}
    >
      <div className="flex gap-4 h-[calc(100vh-10rem)]">
        {/* Left controls */}
        <div className="w-52 shrink-0 flex flex-col gap-4">
          <LayerToggles />
          <MapLegend />
        </div>

        {/* Map area */}
        <div className="relative flex-1">
          <MapPlaceholder className="h-full" />
          <IncidentPopup />
        </div>
      </div>
    </PageShell>
  );
}
