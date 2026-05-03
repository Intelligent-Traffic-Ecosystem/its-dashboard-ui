"use client";

import { useMemo } from "react";
import Map, { GeolocateControl, Layer, Marker, NavigationControl, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { INCIDENTS } from "@/lib/dummy-data";
import type { Incident, Severity } from "@/lib/types";

const MAP_STYLE = "mapbox://styles/mapbox/navigation-night-v1";
const COLOMBO_CENTER = { lat: 6.9271, lng: 79.8612 };
const SOURCE_CENTER = { lat: 51.51, lng: -0.1 };

function severityColor(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "#EF4444";
    case "high":
      return "#D16900";
    case "medium":
      return "#F59E0B";
    case "low":
    default:
      return "#3B82F6";
  }
}

function severityWeight(severity: Severity): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}

const heatmapLayerStyle = {
  id: "incidents-heat",
  type: "heatmap" as const,
  paint: {
    "heatmap-weight": ["get", "weight"],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 14, 3],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(34,197,94,0)",
      0.2,
      "rgba(245,158,11,0.5)",
      0.4,
      "rgba(209,105,0,0.65)",
      0.6,
      "rgba(239,68,68,0.75)",
      1,
      "rgba(239,68,68,0.9)",
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 12, 28],
    "heatmap-opacity": 0.75,
  },
};

export interface MapViewProps {
  className?: string;
  activeLayers: Set<string>;
  onSelectIncident: (incident: Incident) => void;
}

export function MapView({ className = "", activeLayers, onSelectIncident }: MapViewProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mappedIncidents = useMemo(
    () =>
      INCIDENTS.map((incident) => ({
        ...incident,
        lat: COLOMBO_CENTER.lat + (incident.lat - SOURCE_CENTER.lat),
        lng: COLOMBO_CENTER.lng + (incident.lng - SOURCE_CENTER.lng),
      })),
    []
  );

  const heatmapGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: mappedIncidents.map((i) => ({
        type: "Feature" as const,
        properties: { weight: severityWeight(i.severity) },
        geometry: {
          type: "Point" as const,
          coordinates: [i.lng, i.lat] as [number, number],
        },
      })),
    }),
    [mappedIncidents]
  );

  if (!token) {
    return (
      <div
        className={`flex flex-1 min-h-[320px] items-center justify-center rounded-xl sm:min-h-[500px] ${className}`}
        style={{ background: "#0A0E1A", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="px-4 text-center text-sm" style={{ color: "#757780" }}>
          Set <code className="text-secondary">NEXT_PUBLIC_MAPBOX_TOKEN</code> in{" "}
          <code className="text-secondary">.env.local</code> to load the map.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex-1 min-h-[320px] overflow-hidden rounded-xl sm:min-h-[500px] ${className}`}
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          longitude: COLOMBO_CENTER.lng,
          latitude: COLOMBO_CENTER.lat,
          zoom: 11.8,
        }}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
        mapStyle={MAP_STYLE}
        reuseMaps
      >
        <NavigationControl
          position="bottom-right"
          showCompass={false}
          visualizePitch={false}
          style={{ margin: "0 12px 56px 0" }}
        />
        <GeolocateControl
          position="bottom-right"
          trackUserLocation={false}
          showUserLocation
          showAccuracyCircle
          positionOptions={{ enableHighAccuracy: true }}
          style={{ margin: "0 12px 12px 0" }}
        />

        {activeLayers.has("heatmap") && (
          <Source id="incidents-heatmap" type="geojson" data={heatmapGeoJson}>
            {/* Mapbox expression tuples are widened by TS; runtime shape is valid */}
            <Layer {...(heatmapLayerStyle as Parameters<typeof Layer>[0])} />
          </Source>
        )}

        {activeLayers.has("incidents") &&
          mappedIncidents.map((incident) => (
            <Marker
              key={incident.id}
              longitude={incident.lng}
              latitude={incident.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelectIncident(incident);
              }}
            >
              <button
                type="button"
                className="size-3 rounded-full border-2 border-white/30 shadow-md transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-secondary"
                style={{ backgroundColor: severityColor(incident.severity) }}
                aria-label={`Incident ${incident.id} at ${incident.location}`}
              />
            </Marker>
          ))}
      </Map>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 20%, rgba(59,130,246,0.12), transparent 45%), radial-gradient(circle at 90% 85%, rgba(76,215,246,0.10), transparent 40%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
