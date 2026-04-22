// 24-hour traffic volume bar heights (relative %)
const volumeBars = [50, 25, 33, 75, 100, 80, 50, 66, 50, 33];

export default function ChartPanel() {
  return (
    <div className="bg-surface-container border border-white/10 rounded p-md space-y-8">
      {/* Traffic Volume 24H */}
      <div>
        <h3 className="font-headline-md text-sm font-bold uppercase tracking-widest text-white mb-6">
          TRAFFIC VOLUME (24H)
        </h3>
        <div className="h-48 flex items-end justify-between gap-1 px-2">
          {volumeBars.map((h, i) => (
            <div
              key={i}
              className={`w-full rounded-t-sm transition-all hover:opacity-100 ${
                h >= 80 ? "bg-primary/80 hover:bg-primary" : h >= 60 ? "bg-primary/60 hover:bg-primary" : "bg-primary/20 hover:bg-primary/40"
              }`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-mono-data text-slate-500 uppercase">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:59</span>
        </div>
      </div>

      {/* Congestion Breakdown */}
      <div className="pt-6 border-t border-white/5">
        <h3 className="font-headline-md text-sm font-bold uppercase tracking-widest text-white mb-8">
          CONGESTION BREAKDOWN
        </h3>
        <div className="flex justify-center items-center py-4">
          {/* Diamond gauge */}
          <div className="relative w-32 h-32 rotate-45 border-4 border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-20" />
            <div className="absolute bottom-0 left-0 h-3/4 w-3/4 bg-primary/80 shadow-[0_0_20px_rgba(173,198,255,0.4)]" />
            <div className="-rotate-45 absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">68%</span>
              <span className="text-[9px] font-bold text-primary-fixed uppercase tracking-widest">LOAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
