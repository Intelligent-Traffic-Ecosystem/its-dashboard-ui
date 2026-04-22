const bars = [
  { height: 30, label: null, active: false },
  { height: 45, label: null, active: false },
  { height: 85, label: null, active: false },
  { height: 100, label: "42k", active: true },
  { height: 70, label: null, active: false },
  { height: 50, label: null, active: false },
  { height: 35, label: null, active: false },
  { height: 25, label: null, active: false },
];

export default function PeakHourChart() {
  return (
    <div className="col-span-4 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-[400px]">
      <div className="mb-xl">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          Peak Hour Distribution
        </h3>
        <p className="text-[11px] text-on-surface-variant">Volume per hourly segment</p>
      </div>

      <div className="flex-1 flex items-end gap-2 px-sm">
        {bars.map((bar, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t group relative transition-colors ${
              bar.active
                ? "bg-secondary hover:bg-secondary-container"
                : "bg-surface-variant hover:bg-secondary-container"
            }`}
            style={{ height: `${bar.height}%` }}
          >
            {bar.label && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-secondary font-bold">
                {bar.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-md px-sm text-[10px] text-on-surface-variant font-mono-data">
        <span>06:00</span>
        <span>08:00</span>
        <span>10:00</span>
        <span>12:00</span>
      </div>
    </div>
  );
}
