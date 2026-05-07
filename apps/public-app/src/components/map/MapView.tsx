"use client";

import { useEffect, useMemo, useState } from "react";
import Map, { GeolocateControl, Layer, Marker, NavigationControl, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { getPublicMapData, type HeatmapPoint } from "@/lib/public-map-api";
import type { Incident, Severity } from "@/lib/types";

const MAP_STYLE = "mapbox://styles/mapbox/navigation-night-v1";
const COLOMBO_CENTER = { lat: 6.9271, lng: 79.8612 };
const REFRESH_MS = 15000;

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

function heatmapWeight(point: HeatmapPoint): number {
  if (typeof point.weight === "number") return Math.max(0.1, Math.min(1, point.weight));
  const score = point.congestionScore ?? 0;
  return Math.max(0.1, Math.min(1, score / 100));
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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trafficLocations, setTrafficLocations] = useState<Incident[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMapData(showLoading: boolean) {
      try {
        if (showLoading) setLoading(true);
        const data = await getPublicMapData();
        if (!mounted) return;
        setHeatmap(data.heatmap);
        setIncidents(data.incidents);
        setTrafficLocations(data.trafficLocations);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load map data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMapData(true);
    const interval = window.setInterval(() => loadMapData(false), REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const heatmapGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: heatmap
        .filter((point) => {
          const lat = point.lat ?? point.latitude;
          const lng = point.lng ?? point.longitude;
          return typeof lat === "number" && typeof lng === "number";
        })
        .map((point) => {
          const lat = point.lat ?? point.latitude;
          const lng = point.lng ?? point.longitude;
          return {
            type: "Feature" as const,
            properties: {
              cameraId: point.cameraId ?? point.camera_id,
              weight: heatmapWeight(point),
              vehicleCount: point.vehicleCount ?? point.vehicle_count ?? 0,
              congestionScore: point.congestionScore ?? 0,
            },
            geometry: {
              type: "Point" as const,
              coordinates: [lng as number, lat as number] as [number, number],
            },
          };
        }),
    }),
    [heatmap]
  );

  const allMarkers = useMemo(
    () => [
      ...(activeLayers.has("flow") ? trafficLocations : []),
      ...(activeLayers.has("incidents") ? incidents : []),
    ],
    [activeLayers, incidents, trafficLocations]
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

        {allMarkers.map((incident) => (
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
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-2">
        {loading && (
          <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white shadow-lg">
            Loading live traffic data...
          </span>
        )}
        {error && (
          <span className="max-w-xs rounded-lg border border-red-400/30 bg-red-950/80 px-3 py-1.5 text-xs text-red-100 shadow-lg">
            Map data unavailable. {error}
          </span>
        )}
      </div>
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
