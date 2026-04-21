const bars = [40, 55, 45, 70, 65, 30, 50, 85, 60, 40];

export default function CongestionIndexChart() {
  return (
    <div className="col-span-8 bg-surface-container border border-white/10 p-lg rounded-xl flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-xl">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          Daily Congestion Index
        </h3>
        <div className="flex items-center gap-md">
          <span className="flex items-center gap-xs text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Current Period
          </span>
          <span className="flex items-center gap-xs text-xs text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-outline-variant inline-block" />
            Previous Period
          </span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 relative flex items-end gap-1">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-xs pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-white/5 w-full" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative w-full h-full flex items-end px-md gap-4">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 border-t-2 border-primary rounded-t-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-md px-md text-[10px] text-on-surface-variant font-mono-data">
        <span>DAY 01</span>
        <span>DAY 07</span>
        <span>DAY 14</span>
        <span>DAY 21</span>
        <span>DAY 30</span>
      </div>
    </div>
  );
}
