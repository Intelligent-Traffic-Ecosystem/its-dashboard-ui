"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MapPin {
  id: string;
  type: "incident" | "sensor" | "cctv" | "construction";
  severity: "critical" | "warning" | "info" | "emergency";
  lat: number;
  lng: number;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  details: Record<string, string | number>;
}

export interface IncidentPoint {
  alertId?: string | number;
  alert_id?: string | number;
  cameraId?: string;
  camera_id?: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  severity?: string;
  alertType?: string;
  alert_type?: string;
  title?: string;
  message?: string;
  timestamp?: string;
  triggered_at?: string;
}

export interface HeatPoint {
  cameraId?: string;
  camera_id?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  weight?: number;
  vehicleCount?: number;
  vehicle_count?: number;
  congestionScore?: number;
}

interface GoogleMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  allowCustomPins?: boolean;
  /** Live alerts to render as Google markers (always follows map view). */
  incidents?: IncidentPoint[];
  /** Live heatmap points to render as a Google visualization HeatmapLayer. */
  heatmap?: HeatPoint[];
  showIncidents?: boolean;
  showHeatmap?: boolean;
  showCameras?: boolean;
  satellite?: boolean;
}

const SCRIPT_ID = "google-maps-sdk";
const DEFAULT_CENTER = { lat: 6.9108, lng: 79.8699 }; // Borella, Colombo

const PIN_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  incident_critical:  { bg: "#7f1d1d", border: "#ef4444", icon: "warning" },
  incident_warning:   { bg: "#78350f", border: "#f59e0b", icon: "warning" },
  incident_info:      { bg: "#1e3a5f", border: "#adc6ff", icon: "info" },
  construction:       { bg: "#451a03", border: "#ffb786", icon: "construction" },
  sensor:             { bg: "#0c2a3a", border: "#4cd7f6", icon: "sensors" },
  cctv:               { bg: "#052e16", border: "#22c55e", icon: "videocam" },
};

const INCIDENT_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  emergency: { bg: "#450a0a", border: "#ef4444", icon: "emergency" },
  critical:  { bg: "#7f1d1d", border: "#ef4444", icon: "warning" },
  warning:   { bg: "#78350f", border: "#f59e0b", icon: "warning" },
  informational: { bg: "#1e3a5f", border: "#adc6ff", icon: "info" },
};

function getPinStyle(pin: MapPin) {
  return (
    PIN_STYLE[`${pin.type}_${pin.severity}`] ??
    PIN_STYLE[pin.type] ??
    PIN_STYLE.incident_info
  );
}

function getIncidentStyle(severity: string) {
  return INCIDENT_STYLE[severity.toLowerCase()] ?? INCIDENT_STYLE.informational;
}

function buildMarkerElement(style: { bg: string; border: string; icon: string }, pulse = false): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width:36px;height:36px;border-radius:50%;
    background:${style.bg};border:2px solid ${style.border};
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;box-shadow:0 0 8px ${style.border}66;
    font-family:'Material Symbols Outlined',sans-serif;
    font-size:18px;color:${style.border};
    font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;
  `;
  el.textContent = style.icon;
  if (pulse) el.style.animation = "pulse 2s infinite";
  return el;
}

function buildPinInfo(pin: MapPin): HTMLElement {
  const style = getPinStyle(pin);
  const ago = Math.round((Date.now() - new Date(pin.timestamp).getTime()) / 60000);
  const agoLabel = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;

  const wrap = document.createElement("div");
  wrap.style.cssText = "font-family:Inter,sans-serif;padding:2px;min-width:220px;max-width:260px";
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
      <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
        background:${style.bg};color:${style.border};
        border:1px solid ${style.border}44;padding:2px 8px;border-radius:4px">${pin.type}</span>
      <span style="font-size:11px;color:#8c909f;font-variant-numeric:tabular-nums">${agoLabel}</span>
    </div>
    <div style="font-size:14px;font-weight:600;color:#e1e2ec;margin-bottom:4px;line-height:1.3">${pin.title}</div>
    <div style="font-size:12px;color:#8c909f;margin-bottom:10px;line-height:1.5">${pin.description}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      ${Object.entries(pin.details).map(([k, v]) => `
        <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#424754;margin-bottom:2px">
            ${k.replace(/([A-Z])/g, " $1")}
          </div>
          <div style="font-size:13px;font-weight:600;color:${style.border}">${v}</div>
        </div>`).join("")}
      <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#424754;margin-bottom:2px">Status</div>
        <div style="font-size:13px;font-weight:600;color:#22c55e">${pin.status}</div>
      </div>
    </div>`;
  return wrap;
}

function buildIncidentInfo(incident: IncidentPoint): HTMLElement {
  const severity = String(incident.severity || "informational").toLowerCase();
  const style = getIncidentStyle(severity);
  const ts = incident.timestamp ?? incident.triggered_at ?? new Date().toISOString();
  const ago = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  const agoLabel = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;

  const wrap = document.createElement("div");
  wrap.style.cssText = "font-family:Inter,sans-serif;padding:2px;min-width:220px;max-width:260px";
  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
      <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
        background:${style.bg};color:${style.border};
        border:1px solid ${style.border}44;padding:2px 8px;border-radius:4px">${severity}</span>
      <span style="font-size:11px;color:#8c909f;font-variant-numeric:tabular-nums">${agoLabel}</span>
    </div>
    <div style="font-size:14px;font-weight:600;color:#e1e2ec;margin-bottom:4px;line-height:1.3">
      ${incident.title ?? "Active traffic incident"}
    </div>
    <div style="font-size:12px;color:#8c909f;margin-bottom:10px;line-height:1.5">
      ${incident.message ?? incident.alertType ?? incident.alert_type ?? "Live congestion alert"}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">
      <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
        <div style="font-size:9px;text-transform:uppercase;color:#424754;margin-bottom:2px">Camera</div>
        <div style="font-weight:600;color:${style.border}">${incident.cameraId ?? incident.camera_id ?? "—"}</div>
      </div>
      <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
        <div style="font-size:9px;text-transform:uppercase;color:#424754;margin-bottom:2px">Type</div>
        <div style="font-weight:600;color:${style.border}">${incident.alertType ?? incident.alert_type ?? "congestion"}</div>
      </div>
    </div>`;
  return wrap;
}

function isUsableGoogleKey(apiKey: string) {
  return apiKey.trim().length > 0 && !apiKey.includes("YOUR_") && apiKey !== "DEMO_MAP_ID";
}

async function fetchMapPins(): Promise<MapPin[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) return [];
  try {
    const res = await fetch(`${backendUrl}/api/locations`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return [];
  }
}

function pointLatLng(p: IncidentPoint | HeatPoint): { lat: number; lng: number } | null {
  const lat = (p as any).lat ?? (p as any).latitude;
  const lng = (p as any).lng ?? (p as any).longitude;
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function LocalFallbackMap({
  pins,
  incidents,
  heatmap,
  showIncidents,
  showHeatmap,
  showCameras,
}: {
  pins: MapPin[];
  incidents: IncidentPoint[];
  heatmap: HeatPoint[];
  showIncidents: boolean;
  showHeatmap: boolean;
  showCameras: boolean;
}) {
  // Colombo District bounding box — covers cam_01 (Bambalapitiya) + cam_02 (Kelaniya).
  const minLat = 6.83;
  const maxLat = 6.97;
  const minLng = 79.83;
  const maxLng = 79.94;

  const project = (lat: number, lng: number) => ({
    left: ((lng - minLng) / (maxLng - minLng)) * 84 + 8,
    top: (1 - (lat - minLat) / (maxLat - minLat)) * 74 + 10,
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121822]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(76,215,246,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(76,215,246,.10)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(76,215,246,.18),transparent_42%),linear-gradient(135deg,rgba(173,198,255,.12),transparent_45%)]" />
      <div className="absolute left-[8%] right-[10%] top-[38%] h-3 rotate-[-8deg] rounded-full bg-[#2d3542]" />
      <div className="absolute left-[18%] right-[6%] top-[58%] h-3 rotate-[12deg] rounded-full bg-[#2d3542]" />
      <div className="absolute bottom-4 left-4 rounded bg-surface-container/90 px-3 py-2 text-[11px] text-on-surface-variant border border-outline-variant">
        Colombo District preview — add a valid Google Maps API key for live tiles.
      </div>

      {showHeatmap && heatmap.map((p, i) => {
        const ll = pointLatLng(p);
        if (!ll) return null;
        const w = Math.max(0.15, Math.min(1, p.weight ?? 0.3));
        const { left, top } = project(ll.lat, ll.lng);
        return (
          <div
            key={`heat-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-md pointer-events-none"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${40 + w * 80}px`,
              height: `${40 + w * 80}px`,
              background: `rgba(239, 68, 68, ${0.12 + w * 0.28})`,
              boxShadow: `0 0 ${24 + w * 40}px rgba(245, 158, 11, ${0.15 + w * 0.25})`,
            }}
          />
        );
      })}

      {showCameras && pins.map((pin) => {
        const style = getPinStyle(pin);
        const { left, top } = project(pin.lat, pin.lng);
        return (
          <button
            key={pin.id}
            type="button"
            title={`${pin.title}: ${pin.description}`}
            className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg"
            style={{ left: `${left}%`, top: `${top}%`, background: style.bg, borderColor: style.border, color: style.border }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{style.icon}</span>
          </button>
        );
      })}

      {showIncidents && incidents.map((inc, i) => {
        const ll = pointLatLng(inc);
        if (!ll) return null;
        const severity = String(inc.severity || "informational").toLowerCase();
        const style = getIncidentStyle(severity);
        const { left, top } = project(ll.lat, ll.lng);
        return (
          <button
            key={`inc-${i}`}
            type="button"
            title={inc.title ?? "Active incident"}
            className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-lg animate-pulse"
            style={{ left: `${left}%`, top: `${top}%`, background: style.bg, borderColor: style.border, color: style.border }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{style.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function GoogleMap({
  className = "absolute inset-0",
  center = DEFAULT_CENTER,
  zoom = 13,
  allowCustomPins = false,
  incidents = [],
  heatmap = [],
  showIncidents = true,
  showHeatmap = false,
  showCameras = true,
  satellite = false,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);
  const cameraMarkersRef = useRef<any[]>([]);
  const incidentMarkersRef = useRef<any[]>([]);
  const heatLayerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const AdvancedRef = useRef<any>(null);

  useEffect(() => {
    if (initialised.current || !containerRef.current) return;
    initialised.current = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

    (window as any).gm_authFailure = () => {
      setError("Google Maps API key is missing or invalid.");
      setUseFallback(true);
    };

    async function initMap() {
      if (!isUsableGoogleKey(apiKey)) {
        setError("Google Maps API key is missing. Showing local map preview.");
        setUseFallback(true);
        setPins(await fetchMapPins());
        return;
      }

      const g = (window as any).google;
      const { Map, InfoWindow } = await g.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

      const container = containerRef.current;
      const map = new Map(container, {
        zoom,
        center,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID ?? "DEMO_MAP_ID",
        gestureHandling: "greedy",
        mapTypeId: satellite ? "satellite" : "roadmap",
      });

      g.maps.event.trigger(map, "resize");
      mapRef.current = map;
      infoWindowRef.current = new InfoWindow();
      AdvancedRef.current = AdvancedMarkerElement;

      if (allowCustomPins) {
        map.addListener("click", (e: any) => {
          const latLng = e.latLng;
          new AdvancedMarkerElement({ map, position: latLng, title: "Custom pin" });
        });
      }

      const fetched = await fetchMapPins();
      setPins(fetched);
    }

    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if ((window as any).google?.maps?.importLibrary) {
          resolve();
          return;
        }
        if (document.getElementById(SCRIPT_ID)) {
          const poll = setInterval(() => {
            if ((window as any).google?.maps?.importLibrary) {
              clearInterval(poll);
              resolve();
            }
          }, 50);
          return;
        }

        const bootstrap = document.createElement("script");
        bootstrap.id = SCRIPT_ID;
        bootstrap.textContent = `
          (g=>{
            var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",
                q="__ib__",m=document,b=window;
            b=b[c]||(b[c]={});
            var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,
                u=()=>h||(h=new Promise(async(f,n)=>{
                  await (a=m.createElement("script"));
                  e.set("libraries",[...r]+"");
                  for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);
                  e.set("callback",c+".maps."+q);
                  a.src="https://maps."+c+"apis.com/maps/api/js?"+e;
                  d[q]=f;
                  a.onerror=()=>h=n(Error(p+" could not load."));
                  a.nonce=m.querySelector("script[nonce]")?.nonce||"";
                  m.head.append(a)
                }));
            d[l]?console.warn(p+" only loads once. Ignoring:",g):
              d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))
          })({key:"${apiKey}",v:"weekly",libraries:"maps,marker,visualization"});
        `;
        bootstrap.onerror = () => reject(new Error("Maps bootstrap failed"));
        document.head.appendChild(bootstrap);
        resolve();
      });
    }

    loadScript()
      .then(initMap)
      .catch(async () => {
        setError("Map could not be loaded. Check your API key.");
        setUseFallback(true);
        setPins(await fetchMapPins());
      });

    const interval = setInterval(async () => {
      try {
        const next = await fetchMapPins();
        setPins(next);
      } catch { /* noop */ }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Switch map type when `satellite` flips.
  useEffect(() => {
    if (mapRef.current && (window as any).google?.maps) {
      mapRef.current.setMapTypeId(satellite ? "satellite" : "roadmap");
    }
  }, [satellite]);

  // Render camera pins from /api/locations.
  useEffect(() => {
    if (useFallback) return;
    const map = mapRef.current;
    const Advanced = AdvancedRef.current;
    if (!map || !Advanced) return;

    cameraMarkersRef.current.forEach((m) => (m.map = null));
    cameraMarkersRef.current = [];

    if (!showCameras) return;

    const infoWindow = infoWindowRef.current;
    pins.forEach((pin) => {
      try {
        const marker = new Advanced({
          map,
          position: { lat: pin.lat, lng: pin.lng },
          title: pin.title,
          content: buildMarkerElement(getPinStyle(pin), pin.severity === "critical"),
        });
        marker.addListener("gmp-click", () => {
          infoWindow.setContent(buildPinInfo(pin));
          infoWindow.open(map, marker);
        });
        cameraMarkersRef.current.push(marker);
      } catch { /* noop */ }
    });
  }, [pins, showCameras, useFallback]);

  // Render incident markers (live alerts).
  useEffect(() => {
    if (useFallback) return;
    const map = mapRef.current;
    const Advanced = AdvancedRef.current;
    if (!map || !Advanced) return;

    incidentMarkersRef.current.forEach((m) => (m.map = null));
    incidentMarkersRef.current = [];

    if (!showIncidents) return;

    const infoWindow = infoWindowRef.current;
    incidents.forEach((incident) => {
      const ll = pointLatLng(incident);
      if (!ll) return;
      const severity = String(incident.severity || "informational").toLowerCase();
      const style = getIncidentStyle(severity);
      try {
        const marker = new Advanced({
          map,
          position: ll,
          title: incident.title ?? "Active incident",
          content: buildMarkerElement(style, severity === "critical" || severity === "emergency"),
        });
        marker.addListener("gmp-click", () => {
          infoWindow.setContent(buildIncidentInfo(incident));
          infoWindow.open(map, marker);
        });
        incidentMarkersRef.current.push(marker);
      } catch { /* noop */ }
    });
  }, [incidents, showIncidents, useFallback]);

  // Render heatmap layer (visualization library).
  useEffect(() => {
    if (useFallback) return;
    const map = mapRef.current;
    const g = (window as any).google;
    if (!map || !g?.maps) return;

    (async () => {
      if (heatLayerRef.current) {
        heatLayerRef.current.setMap(null);
        heatLayerRef.current = null;
      }
      if (!showHeatmap || !heatmap.length) return;

      try {
        const viz = await g.maps.importLibrary("visualization");
        const data = heatmap
          .map((p) => {
            const ll = pointLatLng(p);
            if (!ll) return null;
            const w = Math.max(0.15, Math.min(1, p.weight ?? (p.congestionScore ?? 0) / 1));
            return { location: new g.maps.LatLng(ll.lat, ll.lng), weight: w };
          })
          .filter(Boolean);
        if (!data.length) return;
        heatLayerRef.current = new viz.HeatmapLayer({
          data,
          map,
          radius: 50,
          opacity: 0.75,
        });
      } catch { /* noop */ }
    })();
  }, [heatmap, showHeatmap, useFallback]);

  // Memoized incidents/heatmap for fallback view (avoid re-renders).
  const fallbackInc = useMemo(() => incidents, [incidents]);
  const fallbackHeat = useMemo(() => heatmap, [heatmap]);

  return (
    <>
      <div ref={containerRef} className={className} />
      {useFallback && (
        <LocalFallbackMap
          pins={pins}
          incidents={fallbackInc}
          heatmap={fallbackHeat}
          showIncidents={showIncidents}
          showHeatmap={showHeatmap}
          showCameras={showCameras}
        />
      )}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-error-container border border-error/30 text-on-error-container text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
          {error}
        </div>
      )}
    </>
  );
}
