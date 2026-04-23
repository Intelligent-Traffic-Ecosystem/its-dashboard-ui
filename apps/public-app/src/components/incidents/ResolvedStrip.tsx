import { CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { INCIDENTS } from "@/lib/dummy-data";

function timeBetween(start: string, end: string): string {
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function ResolvedStrip() {
  const resolved = INCIDENTS.filter(
    (i) => i.status === "resolved" && i.resolvedAt
  ).sort(
    (a, b) =>
      new Date(b.resolvedAt!).getTime() - new Date(a.resolvedAt!).getTime()
  );

  if (resolved.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={14} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Recently Resolved</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        {resolved.map((inc) => (
          <div
            key={inc.id}
            className="shrink-0 w-60 rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-500">{inc.id}</span>
              <Badge variant={inc.type} />
            </div>
            <p className="text-sm text-zinc-300 leading-snug">{inc.location}</p>
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Clock size={10} />
              Duration:{" "}
              <span className="text-zinc-400 font-medium ml-0.5">
                {timeBetween(inc.reportedAt, inc.resolvedAt!)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-400 font-medium">
                Resolved
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
