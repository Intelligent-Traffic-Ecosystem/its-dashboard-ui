import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";
import MapBackground from "@/components/maps/MapBackground";
import GeofenceTool from "@/components/maps/GeofenceTool";
import IncidentMarkers from "@/components/maps/IncidentMarkers";
import LayerToggleControl from "@/components/maps/LayerToggleControl";
import TelemetryHUD from "@/components/maps/TelemetryHUD";
import MapNavControls from "@/components/maps/MapNavControls";

export default function MapsPage() {
  return (
    <>
      <TopNavBar />
      <SideNavBar />

      {/* Full-viewport map canvas: starts below TopNavBar (top-14) and beside SideNavBar (left-64) */}
      <main className="fixed top-14 bottom-0 left-64 right-0 bg-[#0F1923] overflow-hidden">
        {/* Layer 0 – satellite image + heatmap blobs + speed SVG */}
        <MapBackground />

        {/* Layer 1 – incident markers with hover popup */}
        <IncidentMarkers />

        {/* Layer 2 – geofence drawing toolbar (top center) */}
        <GeofenceTool />

        {/* Layer 2 – zoom / compass controls (top right) */}
        <MapNavControls />

        {/* Layer 2 – telemetry stats (bottom left) */}
        <TelemetryHUD />

        {/* Layer 2 – layer toggle panel (bottom right) */}
        <LayerToggleControl />
      </main>
    </>
  );
}
