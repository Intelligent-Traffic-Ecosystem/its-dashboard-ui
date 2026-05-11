const CONGESTION_ITEMS = [
  { label: "Free flow",  color: "#22C55E", range: "< 40%" },
  { label: "Moderate",   color: "#F59E0B", range: "40–60%" },
  { label: "Heavy",      color: "#D16900", range: "60–80%" },
  { label: "Standstill", color: "#EF4444", range: "> 80%" },
];

const CAMERA_PINS = [
  { dot: "#EF4444", label: "Critical congestion" },
  { dot: "#D16900", label: "High congestion" },
  { dot: "#F59E0B", label: "Moderate congestion" },
  { dot: "#3B82F6", label: "Free flow" },
];

export function MapLegend() {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: "#757780" }}
      >
        Congestion
      </p>
      <div className="flex flex-col gap-2 mb-4">
        {CONGESTION_ITEMS.map(({ label, color, range }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className="size-3 rounded-sm shrink-0"
              style={{ background: color }}
            />
            <span className="text-sm text-white" style={{ fontFamily: "var(--font-inter)" }}>{label}</span>
            <span className="ml-auto text-xs tabular-nums" style={{ color: "#757780" }}>
              {range}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
          style={{ color: "#757780" }}
        >
          Camera Pins
        </p>
        {CAMERA_PINS.map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-2.5 mb-2">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ background: dot }}
            />
            <span className="text-xs" style={{ color: "#a0a0a8", fontFamily: "var(--font-inter)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
