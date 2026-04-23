"use client";

import { Search } from "lucide-react";
import type { Severity, IncidentStatus, IncidentType } from "@/lib/types";

interface IncidentFiltersProps {
  search: string;
  severity: Severity | "all";
  status: IncidentStatus | "all";
  type: IncidentType | "all";
  onSearch: (v: string) => void;
  onSeverity: (v: Severity | "all") => void;
  onStatus: (v: IncidentStatus | "all") => void;
  onType: (v: IncidentType | "all") => void;
}

const selectCls =
  "rounded-lg bg-zinc-900 ring-1 ring-zinc-700 px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-cyan-500 cursor-pointer";

export function IncidentFilters({
  search,
  severity,
  status,
  type,
  onSearch,
  onSeverity,
  onStatus,
  onType,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search location or description…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-lg bg-zinc-900 ring-1 ring-zinc-700 pl-8 pr-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-cyan-500"
        />
      </div>

      {/* Severity */}
      <select
        value={severity}
        onChange={(e) => onSeverity(e.target.value as Severity | "all")}
        className={selectCls}
      >
        <option value="all">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value as IncidentStatus | "all")}
        className={selectCls}
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="monitoring">Monitoring</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* Type */}
      <select
        value={type}
        onChange={(e) => onType(e.target.value as IncidentType | "all")}
        className={selectCls}
      >
        <option value="all">All Types</option>
        <option value="accident">Accident</option>
        <option value="congestion">Congestion</option>
        <option value="roadwork">Roadwork</option>
        <option value="hazard">Hazard</option>
        <option value="event">Event</option>
      </select>
    </div>
  );
}
