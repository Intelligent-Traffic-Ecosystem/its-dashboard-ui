// TODO: Replace incidents dummy data with:
// Socket.IO event: socket.on('alert:new', (incident) => addIncident(incident))
// Real-time from B2 YOLO detection → Kafka → Socket.IO relay

import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Incident } from "@/lib/types";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

interface IncidentTableProps {
  incidents: Incident[];
}

export function IncidentTable({ incidents }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center py-16 text-sm"
        style={{
          background: "#1A1D27",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#757780",
          fontFamily: "var(--font-inter)",
        }}
      >
        No incidents match the current filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div
        className="hidden md:block rounded-xl overflow-hidden"
        style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ fontFamily: "var(--font-inter)" }}>
            <thead>
              <tr
                className="text-left text-[11px] uppercase tracking-widest"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  color: "#757780",
                }}
              >
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Lanes</th>
                <th className="px-5 py-3 font-semibold">Reported</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc, i) => (
                <tr
                  key={inc.id}
                  className="transition-colors hover:bg-white/2"
                  style={{
                    borderBottom:
                      i < incidents.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                >
                  <td
                    className="px-5 py-3.5 font-mono text-xs"
                    style={{ color: "#757780" }}
                  >
                    {inc.id}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={inc.severity} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={inc.type} />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={inc.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-1.5 max-w-[220px]">
                      <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: "#757780" }} />
                      <span className="text-white leading-snug">{inc.location}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums" style={{ color: "#a0a0a8" }}>
                    {inc.affectedLanes > 0 ? inc.affectedLanes : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "#757780" }}>
                      <Clock size={11} />
                      {timeAgo(inc.reportedAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="rounded-xl p-4 space-y-3"
            style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Top row: ID + severity + type */}
            <div className="flex items-start justify-between gap-2">
              <span
                className="font-mono text-[11px]"
                style={{ color: "#757780" }}
              >
                {inc.id}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <Badge variant={inc.severity} />
                <Badge variant={inc.type} />
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: "#757780" }} />
              <span className="text-sm text-white leading-snug">{inc.location}</span>
            </div>

            {/* Bottom row: status + time + lanes */}
            <div className="flex items-center justify-between">
              <Badge variant={inc.status} />
              <div className="flex items-center gap-3 text-xs" style={{ color: "#757780" }}>
                {inc.affectedLanes > 0 && (
                  <span>{inc.affectedLanes} lane{inc.affectedLanes > 1 ? "s" : ""}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {timeAgo(inc.reportedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
