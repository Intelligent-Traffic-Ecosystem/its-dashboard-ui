import { PageShell } from "@/components/layout/PageShell";
import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { LayerToggles } from "@/components/map/LayerToggles";
import { MapLegend } from "@/components/map/MapLegend";
import { IncidentPopup } from "@/components/map/IncidentPopup";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

export default function MapPage() {
  return (
    <PageShell
      title="Live Traffic Map"
      subtitle="Geospatial view of active incidents and congestion heatmap"
      actions={<LiveIndicator />}
    >
      <div className="flex flex-col gap-4 md:flex-row md:h-[calc(100vh-10rem)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-52 md:shrink-0 md:flex-col">
          <div className="min-w-0">
            <LayerToggles />
          </div>
          <div className="min-w-0">
            <MapLegend />
          </div>
        </div>

        <div className="relative flex-1 min-h-[320px] sm:min-h-[400px] md:min-h-0">
          <MapPlaceholder className="h-full" />
          <IncidentPopup />
        </div>
      </div>
    </PageShell>
  );
}
