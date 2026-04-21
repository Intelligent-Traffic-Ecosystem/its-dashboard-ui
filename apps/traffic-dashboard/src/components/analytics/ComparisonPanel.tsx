export default function ComparisonPanel() {
  return (
    <div className="bg-surface-container border border-white/10 p-lg rounded-xl">
      {/* Toggle header */}
      <div className="flex justify-between items-center mb-md">
        <h4 className="font-title-sm text-on-surface font-semibold text-[18px]">Comparison View</h4>
        <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out">
          <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out" />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-sm">
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Vs. Prior Month</span>
          <span className="text-error font-mono-data">+2.4%</span>
        </div>
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Vs. Prior Year</span>
          <span className="text-secondary font-mono-data">-1.8%</span>
        </div>
      </div>

      {/* AI Anomaly */}
      <div className="mt-lg pt-lg border-t border-white/5">
        <p className="text-[11px] text-on-surface-variant mb-sm uppercase tracking-[0.08em] font-bold">
          AI ANOMALY DETECTION
        </p>
        <div className="flex items-center gap-sm bg-error-container/20 p-sm rounded border border-error/20">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="text-[11px] text-error font-medium leading-tight">
            Unusual congestion spike on SR-99 attributed to seasonal event overflow.
          </p>
        </div>
      </div>
    </div>
  );
}
