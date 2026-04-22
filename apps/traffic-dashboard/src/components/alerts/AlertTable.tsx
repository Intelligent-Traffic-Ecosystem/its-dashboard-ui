const alerts = [
  {
    id: "#TRF-9921",
    time: "14:22:01",
    type: "Wrong-Way Driver",
    location: "I-95 N @ Exit 42",
    severity: "Critical",
    severityBadge: "bg-red-900/40 text-red-400 border border-red-500/20",
    rowBg: "bg-red-500/5 hover:bg-red-500/10",
    borderColor: "border-l-red-500",
    icon: "error",
    iconClass: "text-red-500 animate-pulse",
    iconFill: true,
    rowOpacity: "",
  },
  {
    id: "#TRF-9918",
    time: "14:18:45",
    type: "Stationary Vehicle",
    location: "Hwy 401, Lane 3",
    severity: "High",
    severityBadge: "bg-orange-900/40 text-orange-400 border border-orange-500/20",
    rowBg: "hover:bg-white/5",
    borderColor: "border-l-orange-500",
    icon: "warning",
    iconClass: "text-orange-500",
    iconFill: false,
    rowOpacity: "",
  },
  {
    id: "#TRF-9902",
    time: "13:55:12",
    type: "Debris on Road",
    location: "I-95 N @ MM 128",
    severity: "Moderate",
    severityBadge: "bg-amber-900/40 text-amber-400 border border-amber-500/20",
    rowBg: "hover:bg-white/5",
    borderColor: "border-l-amber-500",
    icon: "report_problem",
    iconClass: "text-amber-500",
    iconFill: false,
    rowOpacity: "",
  },
  {
    id: "#TRF-9889",
    time: "13:30:00",
    type: "Slow Traffic",
    location: "Expressway Loop",
    severity: "Low",
    severityBadge: "bg-green-900/40 text-green-400 border border-green-500/20",
    rowBg: "hover:bg-white/5",
    borderColor: "border-l-green-500",
    icon: "info",
    iconClass: "text-green-500",
    iconFill: true,
    rowOpacity: "opacity-60 hover:opacity-100",
  },
];

const headers = ["", "Status", "Severity", "ID", "Timestamp", "Type", "Location", "Actions"];

export default function AlertTable() {
  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900/50 text-label-caps text-outline uppercase border-b border-white/5">
            <th className="p-4 w-10">
              <input
                className="rounded bg-surface-container-lowest border-white/20 accent-primary"
                type="checkbox"
              />
            </th>
            {headers.slice(1).map((h) => (
              <th key={h} className="p-4 text-[11px] font-bold tracking-[0.08em]">
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className={`border-l-4 transition-all cursor-pointer ${alert.borderColor} ${alert.rowBg} ${alert.rowOpacity}`}
            >
              <td className="p-4">
                <input
                  className="rounded bg-surface-container-lowest border-white/20 accent-primary"
                  type="checkbox"
                />
              </td>
              <td className="p-4">
                <span
                  className={`material-symbols-outlined ${alert.iconClass}`}
                  style={alert.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {alert.icon}
                </span>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 text-[11px] font-bold rounded uppercase tracking-wider ${alert.severityBadge}`}>
                  {alert.severity}
                </span>
              </td>
              <td className="p-4 font-mono-data text-white">{alert.id}</td>
              <td className="p-4 text-body-sm text-on-surface-variant">{alert.time}</td>
              <td className="p-4 text-body-sm font-semibold text-on-surface">{alert.type}</td>
              <td className="p-4 text-body-sm text-on-surface-variant">{alert.location}</td>
              <td className="p-4">
                <button className="text-primary hover:underline text-xs font-bold uppercase">
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
