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

const selectStyle: React.CSSProperties = {
  background: "#1A1D27",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#d4d4d8",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
  fontFamily: "var(--font-inter)",
  appearance: "auto",
};

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
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#757780" }}
        />
        <input
          type="text"
          placeholder="Search location or description…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            width: "100%",
            background: "#1A1D27",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "8px",
            paddingLeft: "2rem",
            paddingRight: "0.75rem",
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
            fontSize: "13px",
            color: "#d4d4d8",
            outline: "none",
            fontFamily: "var(--font-inter)",
          }}
          className="placeholder:text-neutral focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Severity filter */}
      <select
        value={severity}
        onChange={(e) => onSeverity(e.target.value as Severity | "all")}
        style={selectStyle}
      >
        <option value="all">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => onStatus(e.target.value as IncidentStatus | "all")}
        style={selectStyle}
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="monitoring">Monitoring</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* Type filter */}
      <select
        value={type}
        onChange={(e) => onType(e.target.value as IncidentType | "all")}
        style={selectStyle}
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
