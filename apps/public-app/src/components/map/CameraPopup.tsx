"use client";

import { MapPin, X } from "lucide-react";
import type { Incident, Severity } from "@/lib/types";

const CAMERA_LABELS: Record<string, string> = {
  cam_01: "Galle Road – Bambalapitiya",
  cam_02: "Kandy Road – Kelaniya Junction",
  cam_03: "Colombo Fort – Main Street",
  cam_04: "Nugegoda Junction – High Level Rd",
  cam_05: "Rajagiriya Flyover",
  cam_06: "Maharagama Junction – A4",
  cam_07: "Borella – D.S. Senanayake Mawatha",
  cam_08: "Wellawatte – Galle Road South",
};

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

function congestionBar(severity: Severity): number {
  switch (severity) {
    case "critical": return 90;
    case "high": return 72;
    case "medium": return 48;
    default: return 22;
  }
}

interface CameraPopupProps {
  location: Incident | null;
  onClose: () => void;
}

export function CameraPopup({ location, onClose }: CameraPopupProps) {
  if (!location) return null;

  const cameraId = location.id.replace("TRAFFIC-", "");
  const label = CAMERA_LABELS[cameraId] ?? location.location;
  const color = severityColor(location.severity);
  const barPct = congestionBar(location.severity);
  const isActive = location.status === "active";

  return (
    <div
      className="absolute bottom-4 left-4 z-20 w-72"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      <div
        className="rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: "#1A1D27",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-4 py-3"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="size-2.5 shrink-0 rounded-full mt-0.5 ring-2 ring-white/10"
              style={{ background: color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{label}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-wider" style={{ color: "#757780" }}>
                {cameraId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 shrink-0 rounded-md p-1 transition-colors hover:bg-white/10"
            style={{ color: "#757780" }}
            aria-label="Close popup"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {/* Status + severity row */}
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: isActive ? "rgba(239,68,68,0.14)" : "rgba(59,130,246,0.12)",
                color: isActive ? "#EF4444" : "#3B82F6",
              }}
            >
              {isActive ? "CONGESTED" : "MONITORING"}
            </span>
            <span className="text-xs font-semibold capitalize" style={{ color }}>
              {location.severity} congestion
            </span>
          </div>

          {/* Congestion bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px]" style={{ color: "#757780" }}>Congestion Index</span>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{barPct}%</span>
            </div>
            <div
              className="w-full rounded-full h-1.5"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${barPct}%`, background: color }}
              />
            </div>
          </div>

          {/* Description */}
          <div
            className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", color: "#a0a0a8" }}
          >
            {location.description}
          </div>

          {/* Coordinates */}
          <div
            className="flex items-center gap-1.5 text-[10px]"
            style={{ color: "#757780" }}
          >
            <MapPin size={10} />
            {location.lat.toFixed(4)}°N,&nbsp;{location.lng.toFixed(4)}°E
          </div>
        </div>
      </div>
    </div>
  );
}
