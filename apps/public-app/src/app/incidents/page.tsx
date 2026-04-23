"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SummaryPills } from "@/components/incidents/SummaryPills";
import { IncidentFilters } from "@/components/incidents/IncidentFilters";
import { IncidentTable } from "@/components/incidents/IncidentTable";
import { ResolvedStrip } from "@/components/incidents/ResolvedStrip";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { INCIDENTS } from "@/lib/dummy-data";
import type { Severity, IncidentStatus, IncidentType } from "@/lib/types";

export default function IncidentsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");
  const [type, setType] = useState<IncidentType | "all">("all");

  const filtered = useMemo(() => {
    return INCIDENTS.filter((inc) => {
      if (
        search &&
        !inc.location.toLowerCase().includes(search.toLowerCase()) &&
        !inc.description.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (severity !== "all" && inc.severity !== severity) return false;
      if (status !== "all" && inc.status !== status) return false;
      if (type !== "all" && inc.type !== type) return false;
      return true;
    }).sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }, [search, severity, status, type]);

  return (
    <PageShell
      title="Incident Feed"
      subtitle="Public read-only view of all reported traffic incidents"
      actions={<LiveIndicator />}
    >
      <div className="space-y-6">
        {/* Summary counts */}
        <SummaryPills />

        {/* Filters */}
        <IncidentFilters
          search={search}
          severity={severity}
          status={status}
          type={type}
          onSearch={setSearch}
          onSeverity={setSeverity}
          onStatus={setStatus}
          onType={setType}
        />

        {/* Table */}
        <IncidentTable incidents={filtered} />

        {/* Recently resolved strip */}
        <ResolvedStrip />
      </div>
    </PageShell>
  );
}
