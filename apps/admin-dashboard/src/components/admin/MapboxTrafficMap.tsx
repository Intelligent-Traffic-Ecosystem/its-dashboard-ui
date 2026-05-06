"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  BACKEND_BASE_URL,
  fetchBackendJson,
  type BackendAlert,
  type BackendCamera,
  type BackendLocation,
} from "@/lib/backend";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_STYLE = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/dark-v11";

const FALLBACK_LOCATIONS: BackendLocation[] = [
  {
    id: "CAM-cam_01",
    type: "incident",
    severity: "critical",
    lat: 6.0248,
    lng: 80.2172,
    title: "Traffic camera cam_01",
    description: "High congestion, 31.5 km/h average speed.",
    status: "active",
    timestamp: new Date().toISOString(),
    details: {
      vehicleCount: 12,
      avgSpeedKmh: 31.5,
      congestionScore: 82.4,
      queueLength: 4,
    },
  },
  {
    id: "CAM-cam_02",
    type: "incident",
    severity: "warning",
    lat: 6.0545,
    lng: 80.2209,
    title: "Traffic camera cam_02",
    description: "Moderate congestion, 42.0 km/h average speed.",
    status: "active",
    timestamp: new Date().toISOString(),
    details: {
      vehicleCount: 9,
      avgSpeedKmh: 42,
      congestionScore: 58.3,
      queueLength: 3,
    },
  },
  {
    id: "CAM-cam_03",
    type: "sensor",
    severity: "info",
    lat: 6.0182,
    lng: 80.2477,
    title: "Traffic camera cam_03",
    description: "Light congestion, 56.8 km/h average speed.",
    status: "active",
    timestamp: new Date().toISOString(),
    details: {
      vehicleCount: 5,
      avgSpeedKmh: 56.8,
      congestionScore: 22.7,
      queueLength: 1,
    },
  },
  {
    id: "CAM-cam_04",
    type: "incident",
    severity: "emergency",
    lat: 6.0358,
    lng: 80.2291,
    title: "Traffic camera cam_04",
    description: "Severe slowdown, 18.4 km/h average speed.",
    status: "stale",
    timestamp: new Date().toISOString(),
    details: {
      vehicleCount: 18,
      avgSpeedKmh: 18.4,
      congestionScore: 95.1,
      queueLength: 7,
    },
  },
];

function deriveCameras(locations: BackendLocation[]): BackendCamera[] {
  return locations.map((location) => ({
    cameraId: location.id.replace(/^CAM-/, ""),
    lastSeen: location.timestamp,
    stale: location.status === "stale",
  }));
}

function severityLabel(severity: BackendLocation["severity"]) {
  switch (severity) {
    case "emergency":
      return "bg-error-container text-on-error-container border-error/20";
    case "critical":
      return "bg-error/15 text-error border-error/20";
    case "warning":
      return "bg-tertiary/15 text-tertiary border-tertiary/20";
    default:
      return "bg-primary/15 text-primary border-primary/20";
  }
}

function markerColor(severity: BackendLocation["severity"]) {
  switch (severity) {
    case "emergency":
      return "#ff4d5f";
    case "critical":
      return "#ff7d6e";
    case "warning":
      return "#ffb86b";
    default:
      return "#adc6ff";
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function MapboxTrafficMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [locations, setLocations] = useState<BackendLocation[]>(FALLBACK_LOCATIONS);
  const [alerts, setAlerts] = useState<BackendAlert[]>([]);
  const [cameras, setCameras] = useState<BackendCamera[]>(deriveCameras(FALLBACK_LOCATIONS));
  const [selectedLocation, setSelectedLocation] = useState<BackendLocation>(FALLBACK_LOCATIONS[0]);
  const [backendState, setBackendState] = useState<"live" | "fallback">("fallback");
  const [statusMessage, setStatusMessage] = useState("Showing demo map pins until backend data is available.");

  const mapboxReady = Boolean(MAPBOX_TOKEN);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [locationsResult, alertsResult, camerasResult] = await Promise.allSettled([
        fetchBackendJson<BackendLocation[]>("/api/locations"),
        fetchBackendJson<BackendAlert[]>("/api/alerts/active"),
        fetchBackendJson<BackendCamera[]>("/api/traffic/cameras"),
      ]);

      if (!active) return;

      const nextLocations =
        locationsResult.status === "fulfilled" && locationsResult.value.length
          ? locationsResult.value
          : FALLBACK_LOCATIONS;
      const nextAlerts = alertsResult.status === "fulfilled" ? alertsResult.value : [];
      const nextCameras =
        camerasResult.status === "fulfilled" && camerasResult.value.length
          ? camerasResult.value
          : deriveCameras(nextLocations);

      setLocations(nextLocations);
      setAlerts(nextAlerts);
      setCameras(nextCameras);
      setSelectedLocation((current) =>
        nextLocations.find((location) => location.id === current.id) || nextLocations[0]
      );

      if (
        locationsResult.status === "rejected" &&
        alertsResult.status === "rejected" &&
        camerasResult.status === "rejected"
      ) {
        setBackendState("fallback");
        setStatusMessage(
          `Backend unavailable at ${BACKEND_BASE_URL}. Showing demo map pins for local development.`
        );
      } else {
        setBackendState("live");
        setStatusMessage("Live backend traffic data loaded from /api/locations and /api/alerts/active.");
      }
    }

    loadData().catch(() => {
      if (!active) return;
      setLocations(FALLBACK_LOCATIONS);
      setAlerts([]);
      setCameras(deriveCameras(FALLBACK_LOCATIONS));
      setSelectedLocation(FALLBACK_LOCATIONS[0]);
      setBackendState("fallback");
      setStatusMessage("Showing demo map pins until the backend is reachable.");
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mapboxReady || !mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: [80.23, 6.03],
      zoom: 11.25,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
      const markerElement = document.createElement("button");
      const baseColor = markerColor(location.severity);

      markerElement.type = "button";
      markerElement.setAttribute("aria-label", location.title);
      markerElement.style.width = "18px";
      markerElement.style.height = "18px";
      markerElement.style.borderRadius = "9999px";
      markerElement.style.border = "2px solid rgba(255,255,255,0.85)";
      markerElement.style.background = baseColor;
      markerElement.style.boxShadow = `0 0 0 8px ${baseColor}22, 0 10px 24px rgba(0,0,0,0.35)`;
      markerElement.style.cursor = "pointer";
      markerElement.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";

      markerElement.addEventListener("mouseenter", () => {
        markerElement.style.transform = "scale(1.12)";
      });
      markerElement.addEventListener("mouseleave", () => {
        markerElement.style.transform = "scale(1)";
      });
      markerElement.addEventListener("click", () => setSelectedLocation(location));

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(`
        <div style="min-width:220px;background:#10131a;color:#e1e2ec;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px;">
            <strong style="font-size:14px;">${escapeHtml(location.title)}</strong>
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#adc6ff;">${location.status}</span>
          </div>
          <p style="margin:0 0 8px;color:#c2c6d6;font-size:12px;line-height:1.4;">${escapeHtml(location.description)}</p>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:11px;color:#c2c6d6;">
            <span>Vehicles: <strong style="color:#fff;">${location.details.vehicleCount}</strong></span>
            <span>Speed: <strong style="color:#fff;">${location.details.avgSpeedKmh.toFixed(1)} km/h</strong></span>
            <span>Congestion: <strong style="color:#fff;">${location.details.congestionScore.toFixed(1)}</strong></span>
            <span>Queue: <strong style="color:#fff;">${location.details.queueLength}</strong></span>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([location.lng, location.lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 72, duration: 800, maxZoom: 12.5 });
    }
  }, [locations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation) return;

    map.flyTo({
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 12.25,
      essential: true,
    });
  }, [selectedLocation]);

  const metrics = useMemo(() => {
    const criticalPins = locations.filter(
      (location) => location.severity === "critical" || location.severity === "emergency"
    ).length;
    const stalePins = locations.filter((location) => location.status === "stale").length;
    const activeCameras = cameras.filter((camera) => !camera.stale).length;

    return {
      criticalPins,
      stalePins,
      activeCameras,
      cameraCount: cameras.length,
    };
  }, [cameras, locations]);

  const activeAlerts = alerts.slice(0, 4);

  return (
    <div className="space-y-margin">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface-container px-3 py-1 text-xs uppercase tracking-[0.16em] text-on-surface-variant">
            <span className={`h-2 w-2 rounded-full ${backendState === "live" ? "bg-emerald-400" : "bg-amber-400"}`} />
            {backendState === "live" ? "Backend connected" : "Demo mode"}
          </span>
          <h1 className="mt-4 font-display-lg text-display-lg text-on-surface">
            Live Traffic Map
          </h1>
          <p className="mt-2 max-w-3xl font-body-md text-body-md text-on-surface-variant">
            A Mapbox view of backend map pins, active alerts, and camera health. Click any pin to
            inspect congestion, queue length, and the latest camera snapshot.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
          <div className="font-label-caps text-label-caps text-on-surface-variant">Data sources</div>
          <div className="mt-2 space-y-1 font-mono-data text-mono-data text-on-surface">
            <div>/api/locations</div>
            <div>/api/alerts/active</div>
            <div>/api/traffic/cameras</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-surface-container p-4">
          <div className="font-label-caps text-label-caps text-on-surface-variant">Live pins</div>
          <div className="mt-2 font-display-lg text-display-lg text-on-surface">{locations.length}</div>
          <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Cameras and incident points placed on the map.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-surface-container p-4">
          <div className="font-label-caps text-label-caps text-on-surface-variant">Critical pins</div>
          <div className="mt-2 font-display-lg text-display-lg text-error">{metrics.criticalPins}</div>
          <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Emergency or critical congestion areas.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-surface-container p-4">
          <div className="font-label-caps text-label-caps text-on-surface-variant">Alerts</div>
          <div className="mt-2 font-display-lg text-display-lg text-tertiary-container">
            {alerts.length}
          </div>
          <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Active alerts returned by the backend.
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-surface-container p-4">
          <div className="font-label-caps text-label-caps text-on-surface-variant">Cameras healthy</div>
          <div className="mt-2 font-display-lg text-display-lg text-primary">
            {metrics.activeCameras}/{metrics.cameraCount}
          </div>
          <div className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Cameras with a fresh last-seen timestamp.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-margin xl:grid-cols-[minmax(0,2fr)_420px]">
        <section className="overflow-hidden rounded-xl border border-white/10 bg-surface-container shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Mapbox overview</h2>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {statusMessage}
              </p>
            </div>
            <div className={`rounded-full border px-3 py-1 font-label-caps text-label-caps ${severityLabel(selectedLocation.severity)}`}>
              {selectedLocation.severity} pin
            </div>
          </div>

          <div className="relative min-h-[620px] bg-surface-container-low">
            {!mapboxReady ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high px-8 text-center">
                <div className="max-w-lg space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-surface-container">
                    <span className="material-symbols-outlined text-[28px] text-primary">
                      map
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Mapbox token not configured
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Add <span className="font-mono-data text-mono-data text-on-surface">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span> to
                    <span className="font-mono-data text-mono-data text-on-surface"> apps/admin-dashboard/.env.local</span>
                    to render the interactive map. Backend data is still loaded and visible in the
                    side panel.
                  </p>
                </div>
              </div>
            ) : null}
            <div ref={mapContainerRef} className="absolute inset-0" />
          </div>
        </section>

        <aside className="space-y-margin">
          <section className="rounded-xl border border-white/10 bg-surface-container p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Selected pin</h3>
              <span className="rounded-full border border-white/10 bg-surface-container-high px-3 py-1 font-mono-data text-mono-data text-on-surface-variant">
                {selectedLocation.id}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="font-display-lg text-display-lg text-on-surface">
                  {selectedLocation.title}
                </div>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                  {selectedLocation.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-surface-container-low p-3">
                  <div className="font-label-caps text-label-caps text-on-surface-variant">Vehicles</div>
                  <div className="mt-2 font-display-lg text-display-lg text-on-surface">
                    {selectedLocation.details.vehicleCount}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-container-low p-3">
                  <div className="font-label-caps text-label-caps text-on-surface-variant">Avg speed</div>
                  <div className="mt-2 font-display-lg text-display-lg text-on-surface">
                    {selectedLocation.details.avgSpeedKmh.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-container-low p-3">
                  <div className="font-label-caps text-label-caps text-on-surface-variant">
                    Congestion
                  </div>
                  <div className="mt-2 font-display-lg text-display-lg text-on-surface">
                    {selectedLocation.details.congestionScore.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-container-low p-3">
                  <div className="font-label-caps text-label-caps text-on-surface-variant">Queue</div>
                  <div className="mt-2 font-display-lg text-display-lg text-on-surface">
                    {selectedLocation.details.queueLength}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Timestamp
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface-variant">
                    {new Date(selectedLocation.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-1 font-label-caps text-label-caps ${severityLabel(selectedLocation.severity)}`}>
                    {selectedLocation.severity}
                  </span>
                  <span className="rounded-full border border-white/10 bg-surface-container-high px-2 py-1 font-label-caps text-label-caps text-on-surface-variant">
                    {selectedLocation.status}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-surface-container p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Backend alerts</h3>
              <span className="font-mono-data text-mono-data text-on-surface-variant">
                {activeAlerts.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {activeAlerts.length ? (
                activeAlerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="rounded-lg border border-white/10 bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-label-caps text-label-caps text-primary">{alert.cameraId}</div>
                        <h4 className="mt-1 font-title-sm text-title-sm text-on-surface">
                          {alert.title}
                        </h4>
                      </div>
                      <span className="rounded-full border border-white/10 bg-surface-container-high px-2 py-1 font-mono-data text-mono-data text-on-surface-variant">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                      {alert.description}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-surface-container-low p-4 font-body-sm text-body-sm text-on-surface-variant">
                  No active backend alerts right now.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}