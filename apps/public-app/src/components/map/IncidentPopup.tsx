"use client";

import { X, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Incident } from "@/lib/types";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

interface IncidentPopupProps {
  incident: Incident | null;
  onClose: () => void;
}

export function IncidentPopup({ incident, onClose }: IncidentPopupProps) {
  if (!incident) return null;

  return (
    <div
      className="absolute left-3 right-3 top-3 z-20 overflow-hidden rounded-xl shadow-2xl md:left-auto md:right-4 md:top-4 md:w-72"
      style={{
        background: "rgba(26,29,39,0.96)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-4 pt-3.5 pb-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2 pr-3">
          <Badge variant={incident.severity} />
          <Badge variant={incident.type} />
        </div>
        <button
          onClick={onClose}
          className="shrink-0 transition-opacity hover:opacity-60"
          style={{ color: "#757780" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-2.5">
        <p
          className="text-[10px] font-mono"
          style={{ color: "#757780" }}
        >
          {incident.id}
        </p>
        <div className="flex items-start gap-1.5 text-sm text-white">
          <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: "#757780" }} />
          <span className="font-medium leading-snug">{incident.location}</span>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "#757780", fontFamily: "var(--font-inter)" }}
        >
          {incident.description}
        </p>

        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5 text-xs"
          style={{ color: "#757780" }}
        >
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo(incident.reportedAt)}
          </span>
          {incident.affectedLanes > 0 && (
            <span>
              {incident.affectedLanes} lane
              {incident.affectedLanes > 1 ? "s" : ""} affected
            </span>
          )}
        </div>
      </div>

      {/* Status strip */}
      <div
        className="px-4 py-2.5 text-xs font-semibold"
        style={{
          background: incident.status === "active" ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.10)",
          color: incident.status === "active" ? "#EF4444" : "#F59E0B",
          fontFamily: "var(--font-inter)",
        }}
      >
        {incident.status === "active" ? "Active — response in progress" : "Monitoring"}
      </div>
    </div>
  );
}
