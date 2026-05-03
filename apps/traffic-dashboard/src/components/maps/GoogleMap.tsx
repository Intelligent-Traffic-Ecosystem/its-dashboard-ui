"use client";

import { useEffect, useRef, useState } from "react";

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

interface GoogleMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  allowCustomPins?: boolean;
}

const SCRIPT_ID = "google-maps-sdk";
const DEFAULT_CENTER = { lat: 6.0358656, lng: 80.2291712 };
const USE_DEMO_PINS = process.env.NEXT_PUBLIC_DEMO_MAP_PINS !== "false";

const DEMO_PINS: MapPin[] = [
  {
    id: "DEMO-cam_01",
    type: "incident",
    severity: "critical",
    lat: 6.0248,
    lng: 80.2172,
    title: "Traffic camera cam_01",
    description: "HIGH congestion, 18.5 km/h average speed.",
    status: "demo",
    timestamp: new Date().toISOString(),
    details: { vehicleCount: 34, avgSpeedKmh: 18.5, congestionScore: 91, queueLength: 12 },
  },
  {
    id: "DEMO-cam_02",
    type: "incident",
    severity: "warning",
    lat: 6.0545,
    lng: 80.2209,
    title: "Traffic camera cam_02",
    description: "MEDIUM congestion, 31.2 km/h average speed.",
    status: "demo",
    timestamp: new Date().toISOString(),
    details: { vehicleCount: 21, avgSpeedKmh: 31.2, congestionScore: 66, queueLength: 5 },
  },
  {
    id: "DEMO-cam_03",
    type: "sensor",
    severity: "info",
    lat: 6.0182,
    lng: 80.2477,
    title: "Traffic camera cam_03",
    description: "LOW congestion, 44.8 km/h average speed.",
    status: "demo",
    timestamp: new Date().toISOString(),
    details: { vehicleCount: 13, avgSpeedKmh: 44.8, congestionScore: 24, queueLength: 1 },
  },
  {
    id: "DEMO-cam_04",
    type: "incident",
    severity: "warning",
    lat: 6.0358,
    lng: 80.2291,
    title: "Traffic camera cam_04",
    description: "MEDIUM congestion, 29.6 km/h average speed.",
    status: "demo",
    timestamp: new Date().toISOString(),
    details: { vehicleCount: 25, avgSpeedKmh: 29.6, congestionScore: 72, queueLength: 7 },
  },
];

// Pin colour per type/severity
const PIN_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  incident_critical:  { bg: "#7f1d1d", border: "#ef4444", icon: "warning" },
  incident_warning:   { bg: "#78350f", border: "#f59e0b", icon: "warning" },
  incident_info:      { bg: "#1e3a5f", border: "#adc6ff", icon: "info" },
  construction:       { bg: "#451a03", border: "#ffb786", icon: "construction" },
  sensor:             { bg: "#0c2a3a", border: "#4cd7f6", icon: "sensors" },
  cctv:               { bg: "#052e16", border: "#22c55e", icon: "videocam" },
};

function getPinStyle(pin: MapPin) {
  return (
    PIN_STYLE[`${pin.type}_${pin.severity}`] ??
    PIN_STYLE[pin.type] ??
    PIN_STYLE["incident_info"]
  );
}

function buildMarkerElement(pin: MapPin): HTMLElement {
  const style = getPinStyle(pin);
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
  if (pin.severity === "critical") {
    el.style.animation = "pulse 2s infinite";
  }
  return el;
}

function buildInfoContent(pin: MapPin): HTMLElement {
  const style = getPinStyle(pin);
  const ago = Math.round((Date.now() - new Date(pin.timestamp).getTime()) / 60000);
  const agoLabel = ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`;

  const wrap = document.createElement("div");
  wrap.style.cssText =
    "font-family:Inter,sans-serif;padding:2px;min-width:220px;max-width:260px";

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px">
      <span style="
        font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
        background:${style.bg};color:${style.border};
        border:1px solid ${style.border}44;padding:2px 8px;border-radius:4px
      ">${pin.type}</span>
      <span style="font-size:11px;color:#8c909f;font-variant-numeric:tabular-nums">${agoLabel}</span>
    </div>
    <div style="font-size:14px;font-weight:600;color:#e1e2ec;margin-bottom:4px;line-height:1.3">
      ${pin.title}
    </div>
    <div style="font-size:12px;color:#8c909f;margin-bottom:10px;line-height:1.5">
      ${pin.description}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      ${Object.entries(pin.details)
        .map(
          ([k, v]) => `
        <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#424754;margin-bottom:2px">
            ${k.replace(/([A-Z])/g, " $1").replace(/([a-z])([A-Z])/g, "$1 $2")}
          </div>
          <div style="font-size:13px;font-weight:600;color:${style.border}">${v}</div>
        </div>`
        )
        .join("")}
      <div style="background:#10131a;border:1px solid #424754;border-radius:6px;padding:6px 8px">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#424754;margin-bottom:2px">Status</div>
        <div style="font-size:13px;font-weight:600;color:#22c55e">${pin.status}</div>
      </div>
    </div>
  `;
  return wrap;
}

function isUsableGoogleKey(apiKey: string) {
  return apiKey.trim().length > 0 && !apiKey.includes("YOUR_") && apiKey !== "DEMO_MAP_ID";
}

function getPinsForDisplay(pins: MapPin[]) {
  return pins.length > 0 || !USE_DEMO_PINS ? pins : DEMO_PINS;
}

async function fetchMapPins(): Promise<MapPin[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  console.log("[Map] loadPins — backendUrl:", backendUrl);
  if (!backendUrl) {
    console.warn("[Map] NEXT_PUBLIC_BACKEND_URL not set — using demo pins.");
    return getPinsForDisplay([]);
  }

  try {
    const res = await fetch(`${backendUrl}/api/locations`, { credentials: "include" });
    console.log("[Map] /api/locations response:", res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pins = await res.json();
    console.log("[Map] pins received:", pins.length);
    return getPinsForDisplay(pins);
  } catch (err: any) {
    console.warn("[Map] pins unavailable:", err.message);
    return getPinsForDisplay([]);
  }
}

function LocalFallbackMap({ pins }: { pins: MapPin[] }) {
  const displayPins = getPinsForDisplay(pins);
  const lats = displayPins.map((pin) => pin.lat);
  const lngs = displayPins.map((pin) => pin.lng);
  const minLat = Math.min(...lats, DEFAULT_CENTER.lat - 0.03);
  const maxLat = Math.max(...lats, DEFAULT_CENTER.lat + 0.03);
  const minLng = Math.min(...lngs, DEFAULT_CENTER.lng - 0.03);
  const maxLng = Math.max(...lngs, DEFAULT_CENTER.lng + 0.03);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121822]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(76,215,246,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(76,215,246,.10)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(76,215,246,.18),transparent_42%),linear-gradient(135deg,rgba(173,198,255,.12),transparent_45%)]" />
      <div className="absolute left-[8%] right-[10%] top-[38%] h-3 rotate-[-8deg] rounded-full bg-[#2d3542]" />
      <div className="absolute left-[18%] right-[6%] top-[58%] h-3 rotate-[12deg] rounded-full bg-[#2d3542]" />
      <div className="absolute bottom-4 left-4 rounded bg-surface-container/90 px-3 py-2 text-[11px] text-on-surface-variant border border-outline-variant">
        Local map preview. Add a valid Google Maps API key for live tiles.
      </div>
      {displayPins.map((pin) => {
        const style = getPinStyle(pin);
        const left = ((pin.lng - minLng) / Math.max(maxLng - minLng, 0.0001)) * 84 + 8;
        const top = (1 - (pin.lat - minLat) / Math.max(maxLat - minLat, 0.0001)) * 74 + 10;
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
    </div>
  );
}

export default function GoogleMap({
  className = "absolute inset-0",
  center = DEFAULT_CENTER,
  zoom = 13,
  allowCustomPins = false,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    console.log("[Map] effect fired — initialised:", initialised.current, "container:", !!containerRef.current);
    if (initialised.current || !containerRef.current) return;
    initialised.current = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

    (window as any).gm_authFailure = () => {
      console.warn("[Map] Google Maps auth failed — switching to local preview map.");
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

      console.log("[Map] initMap started");
      const g = (window as any).google;
      console.log("[Map] google.maps:", !!g?.maps, "importLibrary:", typeof g?.maps?.importLibrary);

      const { Map, InfoWindow } = await g.maps.importLibrary("maps");
      console.log("[Map] maps library loaded");
      const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");
      console.log("[Map] marker library loaded");

      const container = containerRef.current;
      console.log("[Map] container size:", container?.offsetWidth, "x", container?.offsetHeight);

      const map = new Map(container, {
        zoom,
        center,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID ?? "DEMO_MAP_ID",
        gestureHandling: "greedy",
      });
      console.log("[Map] Map instance created:", !!map);

      (window as any).google.maps.event.trigger(map, "resize");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => map.setCenter({ lat: coords.latitude, lng: coords.longitude }),
          () => {}
        );
      }

      if (allowCustomPins) {
        const infoWindow = new InfoWindow();
        map.addListener("click", (e: any) => {
          const latLng = e.latLng;
          const marker = new AdvancedMarkerElement({ map, position: latLng, title: "Custom pin" });
          marker.addListener("gmp-click", () => {
            infoWindow.setContent(
              `<p style="font-size:12px">Custom pin<br/>${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}</p>`
            );
            infoWindow.open(map, marker);
          });
        });
      }

      const pins = await fetchMapPins();
      setPins(pins);
      placePins(map, InfoWindow, AdvancedMarkerElement, pins);
    }

    function placePins(map: any, InfoWindow: any, AdvancedMarkerElement: any, pins: MapPin[]) {
      const infoWindow = new InfoWindow();

      pins.forEach((pin) => {
        try {
          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: pin.lat, lng: pin.lng },
            title: pin.title,
            content: buildMarkerElement(pin),
          });
          marker.addListener("gmp-click", () => {
            infoWindow.setContent(buildInfoContent(pin));
            infoWindow.open(map, marker);
          });
          console.log("[Map] pin placed:", pin.id);
        } catch (err: any) {
          console.warn(`[Map] skipping pin ${pin.id}:`, err.message);
        }
      });
    }

    // Injects the official Maps JS API bootstrap loader (same pattern as the
    // standalone HTML version). importLibrary() is available immediately after
    // the inline script runs — the actual library bytes load lazily on demand.
    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        // Already bootstrapped from a previous render
        if ((window as any).google?.maps?.importLibrary) {
          resolve();
          return;
        }

        if (document.getElementById(SCRIPT_ID)) {
          // Bootstrap injected but not yet resolved — wait for it
          const poll = setInterval(() => {
            if ((window as any).google?.maps?.importLibrary) {
              clearInterval(poll);
              resolve();
            }
          }, 50);
          return;
        }

        // Inline bootstrap — mirrors the snippet from the Google Maps docs.
        // Sets up window.google.maps.importLibrary without blocking the page.
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
          })({key:"${apiKey}",v:"weekly"});
        `;

        bootstrap.onerror = () => reject(new Error("Maps bootstrap failed"));
        document.head.appendChild(bootstrap);

        // importLibrary is synchronously available right after the inline script runs
        resolve();
      });
    }

    loadScript()
      .then(initMap)
      .catch(async (err) => {
        console.error("Google Maps failed to load:", err.message);
        setError("Map could not be loaded. Check your API key.");
        setUseFallback(true);
        setPins(await fetchMapPins());
      });
  }, []);

  return (
    <>
      {/* ref goes directly on the element that receives className so there are
          no extra wrappers conflicting with position:absolute / inset:0 */}
      <div ref={containerRef} className={className} />
      {useFallback && <LocalFallbackMap pins={pins} />}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-error-container border border-error/30 text-on-error-container text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
          {error}
        </div>
      )}
    </>
  );
}
