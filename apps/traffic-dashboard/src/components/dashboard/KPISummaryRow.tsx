const kpis = [
  {
    label: "ACTIVE INCIDENTS",
    value: "08",
    valueClass: "text-error",
    badge: { icon: "trending_up", text: "+2.4%", cls: "text-error" },
    dot: true,
  },
  {
    label: "AVG FLOW SPEED",
    value: "42",
    unit: "KM/H",
    valueClass: "text-primary",
    badge: { icon: "trending_down", text: "-12%", cls: "text-primary" },
    dot: true,
  },
  {
    label: "CONGESTION LEVEL",
    value: "MODERATE",
    valueClass: "text-tertiary text-headline-md",
    badge: { icon: "remove", text: "STABLE", cls: "text-tertiary" },
    dot: false,
  },
  {
    label: "SYSTEM ALERTS",
    value: "12",
    valueClass: "text-white",
    badge: { icon: "check_circle", text: "HEALTHY", cls: "text-slate-500" },
    dot: true,
  },
];

export default function KPISummaryRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface-container border border-white/10 p-md rounded flex flex-col justify-between h-24 relative overflow-hidden"
        >
          <span className="text-label-caps text-slate-400 uppercase tracking-[0.08em] font-bold text-[11px]">
            {kpi.label}
          </span>
          <div className="flex items-end justify-between">
            <span className={`font-headline-md text-display-lg font-semibold ${kpi.valueClass}`}>
              {kpi.value}
              {kpi.unit && <span className="text-sm font-normal"> {kpi.unit}</span>}
            </span>
            <div className={`flex items-center text-[10px] font-mono-data ${kpi.badge.cls}`}>
              <span className="material-symbols-outlined text-xs mr-1">{kpi.badge.icon}</span>
              {kpi.badge.text}
            </div>
          </div>
          {kpi.dot && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          )}
        </div>
      ))}
    </div>
  );
}
