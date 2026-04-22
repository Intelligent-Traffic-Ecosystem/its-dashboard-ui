export default function DataCoveragePanel() {
  // Circle: r=28, circumference = 2πr ≈ 175.9
  // 90% fill → dashoffset = 10% of 175.9 ≈ 17.5
  const circumference = 175.9;
  const pct = 90;
  const offset = circumference * ((100 - pct) / 100);

  return (
    <div className="bg-surface-container border border-white/10 p-lg rounded-xl">
      <h4 className="font-title-sm text-on-surface mb-md font-semibold text-[18px]">Data Coverage</h4>
      <div className="flex items-center gap-lg">
        {/* Donut chart */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle
              className="text-surface-variant"
              cx="32"
              cy="32"
              r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              className="text-primary"
              cx="32"
              cy="32"
              r="28"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-on-surface">
            {pct}%
          </span>
        </div>

        <div>
          <p className="text-body-sm text-on-surface font-medium">Sensor Reliability</p>
          <p className="text-[10px] text-on-surface-variant">District 4 IoT Network</p>
        </div>
      </div>
    </div>
  );
}
