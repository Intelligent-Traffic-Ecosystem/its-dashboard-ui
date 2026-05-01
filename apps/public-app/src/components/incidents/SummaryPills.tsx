import { INCIDENTS } from "@/lib/dummy-data";

export function SummaryPills() {
  const total = INCIDENTS.length;
  const active = INCIDENTS.filter((i) => i.status === "active").length;
  const critical = INCIDENTS.filter(
    (i) => i.severity === "critical" && i.status !== "resolved"
  ).length;
  const monitoring = INCIDENTS.filter((i) => i.status === "monitoring").length;
  const resolved = INCIDENTS.filter((i) => i.status === "resolved").length;

  const pills: { label: string; value: number; bg: string; color: string }[] = [
    { label: "Total",      value: total,      bg: "rgba(255,255,255,0.06)", color: "#d4d4d8" },
    { label: "Active",     value: active,     bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
    { label: "Critical",   value: critical,   bg: "rgba(209,105,0,0.12)",   color: "#D16900" },
    { label: "Monitoring", value: monitoring, bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    { label: "Resolved",   value: resolved,   bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
  ];

  return (
    <div className="flex flex-wrap gap-2.5">
      {pills.map(({ label, value, bg, color }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: bg,
            border: `1px solid ${color}30`,
            fontFamily: "var(--font-inter)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "#a0a0a8" }}>
            {label}
          </span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
