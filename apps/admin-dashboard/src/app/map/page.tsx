import MapboxTrafficMap from "@/components/admin/MapboxTrafficMap";

export const metadata = {
  title: "Live Map | ITMS Admin Dashboard",
  description: "Mapbox live map for backend traffic pins and alerts.",
};

export default function MapPage() {
  return <MapboxTrafficMap />;
}