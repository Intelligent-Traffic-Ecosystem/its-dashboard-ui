"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import MapBackground from "@/components/maps/MapBackground";
import GeofenceTool, { type DrawTool } from "@/components/maps/GeofenceTool";
import IncidentMarkers from "@/components/maps/IncidentMarkers";
import LayerToggleControl, { type MapLayerKey } from "@/components/maps/LayerToggleControl";
import TelemetryHUD from "@/components/maps/TelemetryHUD";
import MapNavControls from "@/components/maps/MapNavControls";
import { useMapHeatmap } from "@/lib/hooks/useB3Backend";

type Point = { x: number; y: number };
type FenceShape = {
  id: string;
  mode: DrawTool;
  points: Point[];
  createdAt: string;
};

const STORAGE_KEY = "b3-map-geofences";
const DEFAULT_CENTER = { lat: 6.9108, lng: 79.8699 }; // Borella, Colombo

// Colombo District bounding box
const MAP_BOUNDS = { minLat: 6.83, maxLat: 6.97, minLng: 79.83, maxLng: 79.94 };

function loadFences(): FenceShape[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function shapePath(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function circleGeometry(points: Point[]) {
  const [center, edge] = points;
  const radius = edge ? Math.hypot(edge.x - center.x, edge.y - center.y) : 0;
  return { center, radius };
}

function projectHeatmap(lat?: number, lng?: number) {
  const safeLat = lat ?? DEFAULT_CENTER.lat;
  const safeLng = lng ?? DEFAULT_CENTER.lng;
  const x = ((safeLng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 84 + 8;
  const y = (1 - (safeLat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 74 + 10;
  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(10, Math.min(84, y)),
  };
}

function canSave(mode: DrawTool | null, points: Point[]) {
  if (mode === "polygon") return points.length >= 3;
  if (mode === "circle") return points.length >= 2;
  if (mode === "line") return points.length >= 2;
  return false;
}

function ShapeLayer({ shapes, draft }: { shapes: FenceShape[]; draft: FenceShape | null }) {
  const allShapes = draft ? [...shapes, draft] : shapes;

  return (
    <svg className="absolute inset-0 z-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {allShapes.map((shape) => {
        const isDraft = shape.id === "draft";
        const stroke = isDraft ? "#4cd7f6" : "#adc6ff";
        const fill = isDraft ? "rgba(76,215,246,.16)" : "rgba(173,198,255,.12)";

        if (shape.mode === "circle" && shape.points[0]) {
          const { center, radius } = circleGeometry(shape.points);
          return (
            <g key={shape.id}>
              <circle cx={center.x} cy={center.y} r={radius} fill={fill} stroke={stroke} strokeWidth="0.35" strokeDasharray={isDraft ? "1.2 0.8" : undefined} />
              <circle cx={center.x} cy={center.y} r="0.65" fill={stroke} />
            </g>
          );
        }

        if (shape.mode === "line") {
          return (
            <g key={shape.id}>
              <polyline points={shapePath(shape.points)} fill="none" stroke={stroke} strokeWidth="0.45" strokeDasharray={isDraft ? "1.2 0.8" : undefined} />
              {shape.points.map((point, index) => (
                <circle key={`${shape.id}-${index}`} cx={point.x} cy={point.y} r="0.55" fill={stroke} />
              ))}
            </g>
          );
        }

        return (
          <g key={shape.id}>
            <polygon points={shapePath(shape.points)} fill={fill} stroke={stroke} strokeWidth="0.35" strokeDasharray={isDraft ? "1.2 0.8" : undefined} />
            {shape.points.map((point, index) => (
              <circle key={`${shape.id}-${index}`} cx={point.x} cy={point.y} r="0.55" fill={stroke} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function HeatmapOverlay({ enabled }: { enabled: boolean }) {
  const { data } = useMapHeatmap();
  if (!enabled || !data?.length) return null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {data.map((point, index) => {
        const projected = projectHeatmap(point.lat ?? point.latitude, point.lng ?? point.longitude);
        const weight = Math.max(0.15, Math.min(1, point.weight || 0));
        return (
          <div
            key={`${point.cameraId ?? point.camera_id ?? "heat"}-${index}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
            style={{
              left: `${projected.x}%`,
              top: `${projected.y}%`,
              width: `${36 + weight * 80}px`,
              height: `${36 + weight * 80}px`,
              background: `rgba(239, 68, 68, ${0.12 + weight * 0.28})`,
              boxShadow: `0 0 ${24 + weight * 40}px rgba(245, 158, 11, ${0.15 + weight * 0.25})`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function MapFeatureShell() {
  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>({
    heatmap: true,
    incidents: true,
    speed: true,
    satellite: false,
  });
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [fences, setFences] = useState<FenceShape[]>(() => loadFences());
  const [zoom, setZoom] = useState(1);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fences));
  }, [fences]);

  const draft = useMemo<FenceShape | null>(() => {
    if (!activeTool || !draftPoints.length) return null;
    return { id: "draft", mode: activeTool, points: draftPoints, createdAt: new Date(0).toISOString() };
  }, [activeTool, draftPoints]);

  function handleCanvasClick(event: MouseEvent<HTMLDivElement>) {
    if (!activeTool) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };

    setDraftPoints((prev) => {
      if (activeTool === "circle") return prev.length >= 2 ? [point] : [...prev, point];
      return [...prev, point];
    });
  }

  function selectTool(tool: DrawTool) {
    setActiveTool((current) => (current === tool ? null : tool));
    setDraftPoints([]);
  }

  function saveFence() {
    if (!activeTool || !canSave(activeTool, draftPoints)) return;
    setFences((prev) => [
      ...prev,
      {
        id: `fence-${Date.now()}`,
        mode: activeTool,
        points: draftPoints,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraftPoints([]);
    setActiveTool(null);
  }

  function deleteSelection() {
    if (draftPoints.length) {
      setDraftPoints([]);
      return;
    }
    setFences((prev) => prev.slice(0, -1));
  }

  return (
    <main className="fixed top-14 bottom-0 left-64 right-0 bg-[#0F1923] overflow-hidden">
      <div
        className={`absolute inset-0 transition-transform duration-300 ${layers.satellite ? "brightness-75 saturate-150 contrast-125" : ""}`}
        style={{ transform: `scale(${zoom}) rotate(${bearing}deg)` }}
      >
        <MapBackground />
      </div>

      <HeatmapOverlay enabled={layers.heatmap} />
      {layers.incidents && <IncidentMarkers />}
      <ShapeLayer shapes={fences} draft={draft} />

      {activeTool && (
        <div
          className="absolute inset-0 z-20 cursor-crosshair"
          onClick={handleCanvasClick}
          title="Click map to add geofence points"
        />
      )}

      <GeofenceTool
        activeTool={activeTool}
        canSave={canSave(activeTool, draftPoints)}
        draftCount={draftPoints.length}
        savedCount={fences.length}
        onDelete={deleteSelection}
        onSave={saveFence}
        onSelectTool={selectTool}
      />
      <MapNavControls
        zoom={zoom}
        bearing={bearing}
        onCompass={() => setBearing((value) => (value + 45) % 360)}
        onZoomIn={() => setZoom((value) => Math.min(1.6, Number((value + 0.1).toFixed(1))))}
        onZoomOut={() => setZoom((value) => Math.max(0.8, Number((value - 0.1).toFixed(1))))}
      />
      {layers.speed && <TelemetryHUD />}
      <LayerToggleControl layers={layers} onToggle={(key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))} />
    </main>
  );
}
