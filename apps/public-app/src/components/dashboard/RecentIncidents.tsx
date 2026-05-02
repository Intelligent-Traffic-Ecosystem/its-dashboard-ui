import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { INCIDENTS } from "@/lib/dummy-data";

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

const SEVERITY_DOT: Record<string, string> = {
  critical: "#EF4444",
  high: "#EF4444",
  medium: "#D16900",
  low: "#3B82F6",
};

export function RecentIncidents() {
  const recent = INCIDENTS.filter((i) => i.status !== "resolved")
    .sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    )
    .slice(0, 6);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div>
          <h2
            className="text-[17px] font-semibold text-white"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Recent Incidents
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#757780" }}>
            Read-only · Updated live
          </p>
        </div>
        <Link
          href="/incidents"
          className="flex items-center gap-1 self-start text-xs font-medium transition-opacity hover:opacity-70 sm:self-auto"
          style={{ color: "#3B82F6" }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <ul>
        {recent.map((inc, i) => (
          <li
            key={inc.id}
            className="flex flex-wrap items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/2 sm:flex-nowrap sm:px-5"
            style={{
              borderBottom:
                i < recent.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
            }}
          >
            <span
              className="mt-1.5 size-2 rounded-full shrink-0"
              style={{ background: SEVERITY_DOT[inc.severity] ?? "#757780" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[13px] font-semibold text-white"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)}
                </span>
                <Badge variant={inc.status} />
              </div>
              <p className="mt-0.5 text-xs truncate" style={{ color: "#757780" }}>
                {inc.location}
              </p>
            </div>
            <div
              className="mt-0.5 flex w-full items-center gap-1 text-[10px] sm:w-auto sm:shrink-0"
              style={{ color: "#757780" }}
            >
              <Clock size={10} />
              {timeAgo(inc.reportedAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
