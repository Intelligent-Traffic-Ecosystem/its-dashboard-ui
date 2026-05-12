"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import GoogleMap from "@/components/maps/GoogleMap";
import GeofenceTool, { type DrawTool } from "@/components/maps/GeofenceTool";
import LayerToggleControl, { type MapLayerKey } from "@/components/maps/LayerToggleControl";
import TelemetryHUD from "@/components/maps/TelemetryHUD";
import { useMapHeatmap, useMapIncidents } from "@/lib/hooks/useB3Backend";

type Point = { x: number; y: number };
type FenceShape = {
  id: string;
  mode: DrawTool;
  points: Point[];
  createdAt: string;
};

const STORAGE_KEY = "b3-map-geofences";

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
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

function circleGeometry(points: Point[]) {
  const [center, edge] = points;
  const radius = edge ? Math.hypot(edge.x - center.x, edge.y - center.y) : 0;
  return { center, radius };
}

function canSave(mode: DrawTool | null, points: Point[]) {
  if (mode === "polygon") return points.length >= 3;
  if (mode === "circle") return points.length >= 2;
  if (mode === "line") return points.length >= 2;
  return false;
}

/**
 * Geofence drafting overlay. These are user-drawn screen-space shapes, not
 * geo coordinates — so an SVG overlay that ignores map pan/zoom is correct
 * for this layer (unlike the incidents/heatmap which must follow the map
 * view, and are therefore rendered inside GoogleMap itself).
 */
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
              {shape.points.map((p, i) => (
                <circle key={`${shape.id}-${i}`} cx={p.x} cy={p.y} r="0.55" fill={stroke} />
              ))}
            </g>
          );
        }
        return (
          <g key={shape.id}>
            <polygon points={shapePath(shape.points)} fill={fill} stroke={stroke} strokeWidth="0.35" strokeDasharray={isDraft ? "1.2 0.8" : undefined} />
            {shape.points.map((p, i) => (
              <circle key={`${shape.id}-${i}`} cx={p.x} cy={p.y} r="0.55" fill={stroke} />
            ))}
          </g>
        );
      })}
    </svg>
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

  // Live data — passed straight into GoogleMap, which renders them as native
  // Google overlays that follow pan/zoom/rotate correctly.
  const { data: incidents } = useMapIncidents();
  const { data: heatmap } = useMapHeatmap();

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
    setActiveTool((c) => (c === tool ? null : tool));
    setDraftPoints([]);
  }

  function saveFence() {
    if (!activeTool || !canSave(activeTool, draftPoints)) return;
    setFences((prev) => [
      ...prev,
      { id: `fence-${Date.now()}`, mode: activeTool, points: draftPoints, createdAt: new Date().toISOString() },
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
      <GoogleMap
        className="absolute inset-0 z-0"
        incidents={incidents ?? []}
        heatmap={heatmap ?? []}
        showIncidents={layers.incidents}
        showHeatmap={layers.heatmap}
        satellite={layers.satellite}
      />

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
      {layers.speed && <TelemetryHUD />}
      <LayerToggleControl
        layers={layers}
        onToggle={(key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
      />
    </main>
  );
}
