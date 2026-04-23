import { INCIDENTS } from "@/lib/dummy-data";

export function SummaryPills() {
  const total = INCIDENTS.length;
  const active = INCIDENTS.filter((i) => i.status === "active").length;
  const critical = INCIDENTS.filter(
    (i) => i.severity === "critical" && i.status !== "resolved"
  ).length;
  const monitoring = INCIDENTS.filter((i) => i.status === "monitoring").length;
  const resolved = INCIDENTS.filter((i) => i.status === "resolved").length;

  const pills = [
    { label: "Total", value: total, cls: "bg-zinc-800 text-zinc-300 ring-zinc-700" },
    { label: "Active", value: active, cls: "bg-red-500/10 text-red-400 ring-red-500/20" },
    { label: "Critical", value: critical, cls: "bg-orange-500/10 text-orange-400 ring-orange-500/20" },
    { label: "Monitoring", value: monitoring, cls: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20" },
    { label: "Resolved", value: resolved, cls: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map(({ label, value, cls }) => (
        <div
          key={label}
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 ring-1 text-sm font-medium ${cls}`}
        >
          <span>{label}</span>
          <span className="tabular-nums font-bold">{value}</span>
        </div>
      ))}
    </div>
  );
}
