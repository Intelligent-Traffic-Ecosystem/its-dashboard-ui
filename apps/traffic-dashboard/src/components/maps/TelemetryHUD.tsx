const stats = [
  {
    label: "Avg System Speed",
    value: "54.2",
    unit: "km/h",
    valueClass: "text-primary",
    extra: "",
  },
  {
    label: "Active Units",
    value: "1,248",
    unit: "",
    valueClass: "text-secondary",
    extra: "",
  },
  {
    label: "Response Time",
    value: "4.2",
    unit: "min",
    valueClass: "text-white",
    extra: "border-l-4 border-l-error",
  },
];

export default function TelemetryHUD() {
  return (
    <div className="absolute bottom-lg left-lg z-30 flex gap-4 font-mono-data">
      {stats.map(({ label, value, unit, valueClass, extra }) => (
        <div
          key={label}
          className={`bg-[#243447]/90 backdrop-blur-sm border border-white/10 px-4 py-2 rounded ${extra}`}
        >
          <div className="text-[10px] text-slate-500 uppercase">{label}</div>
          <div className={`text-xl font-bold ${valueClass}`}>
            {value}
            {unit && <span className="text-xs font-normal"> {unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
