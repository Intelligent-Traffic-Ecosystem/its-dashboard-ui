import MapBackground from "@/components/maps/MapBackground";
import GeofenceTool from "@/components/maps/GeofenceTool";
import IncidentMarkers from "@/components/maps/IncidentMarkers";
import LayerToggleControl from "@/components/maps/LayerToggleControl";
import TelemetryHUD from "@/components/maps/TelemetryHUD";
import MapNavControls from "@/components/maps/MapNavControls";

export default function MapsPage() {
  return (
    <main className="fixed top-14 bottom-0 left-64 right-0 bg-[#0F1923] overflow-hidden">
      <MapBackground />
      <IncidentMarkers />
      <GeofenceTool />
      <MapNavControls />
      <TelemetryHUD />
      <LayerToggleControl />
    </main>
  );
}
