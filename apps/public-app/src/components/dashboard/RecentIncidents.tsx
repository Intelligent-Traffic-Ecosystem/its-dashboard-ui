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

export function RecentIncidents() {
  const recent = INCIDENTS.filter((i) => i.status !== "resolved")
    .sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    )
    .slice(0, 6);

  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Recent Incidents</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Latest active &amp; monitored events
          </p>
        </div>
        <Link
          href="/incidents"
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <ul className="divide-y divide-zinc-800/50">
        {recent.map((inc) => (
          <li
            key={inc.id}
            className="px-5 py-3.5 flex items-start gap-3 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-zinc-500">
                  {inc.id}
                </span>
                <Badge variant={inc.severity} />
                <Badge variant={inc.type} />
              </div>
              <p className="mt-1 text-sm text-zinc-300 truncate">
                {inc.location}
              </p>
              <p className="text-xs text-zinc-500 truncate">{inc.description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-600 shrink-0 mt-0.5">
              <Clock size={11} />
              {timeAgo(inc.reportedAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
