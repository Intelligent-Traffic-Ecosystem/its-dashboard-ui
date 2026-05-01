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
        <CheckCircle size={14} style={{ color: "#22C55E" }} />
        <h3
          className="text-sm font-semibold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Recently Resolved
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {resolved.map((inc) => (
          <div
            key={inc.id}
            className="shrink-0 w-60 rounded-xl p-4 flex flex-col gap-2.5"
            style={{
              background: "#1A1D27",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[10px]"
                style={{ color: "#757780" }}
              >
                {inc.id}
              </span>
              <Badge variant={inc.type} />
            </div>
            <p
              className="text-sm text-white leading-snug"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {inc.location}
            </p>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "#757780" }}
            >
              <Clock size={10} />
              Duration:{" "}
              <span className="font-semibold ml-0.5" style={{ color: "#a0a0a8" }}>
                {timeBetween(inc.reportedAt, inc.resolvedAt!)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ background: "#22C55E" }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: "#22C55E" }}
              >
                Resolved
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
