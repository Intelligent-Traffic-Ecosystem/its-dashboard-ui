"use client";

import { useState } from "react";
import { X, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { INCIDENTS } from "@/lib/dummy-data";
import type { Incident } from "@/lib/types";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
}

interface IncidentPopupProps {
  incident?: Incident;
}

export function IncidentPopup({ incident: injected }: IncidentPopupProps) {
  const [dismissed, setDismissed] = useState(false);

  const incident =
    injected ??
    INCIDENTS.filter((i) => i.status === "active" && i.severity === "critical")[0];

  if (!incident || dismissed) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-72 rounded-xl bg-zinc-900/95 backdrop-blur-sm ring-1 ring-zinc-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Badge variant={incident.severity} />
          <Badge variant={incident.type} />
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs font-mono text-zinc-500">{incident.id}</p>
        <div className="flex items-start gap-1.5 text-sm text-zinc-300">
          <MapPin size={13} className="mt-0.5 shrink-0 text-zinc-500" />
          <span className="font-medium">{incident.location}</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {incident.description}
        </p>

        <div className="flex items-center gap-3 pt-1 text-xs text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock size={11} />
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
        className={`px-4 py-2 rounded-b-xl text-xs font-medium ${
          incident.status === "active"
            ? "bg-red-500/10 text-red-400"
            : "bg-yellow-500/10 text-yellow-400"
        }`}
      >
        {incident.status === "active" ? "Active — response in progress" : "Monitoring"}
      </div>
    </div>
  );
}
