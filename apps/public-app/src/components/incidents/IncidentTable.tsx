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
      <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 flex items-center justify-center py-16 text-sm text-zinc-600">
        No incidents match the current filters.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Severity</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Lanes</th>
              <th className="px-5 py-3 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc, i) => (
              <tr
                key={inc.id}
                className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                  i === incidents.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
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
                    <MapPin
                      size={12}
                      className="mt-0.5 shrink-0 text-zinc-600"
                    />
                    <span className="text-zinc-300 leading-snug">
                      {inc.location}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 tabular-nums text-zinc-400">
                  {inc.affectedLanes > 0 ? inc.affectedLanes : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
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
  );
}
