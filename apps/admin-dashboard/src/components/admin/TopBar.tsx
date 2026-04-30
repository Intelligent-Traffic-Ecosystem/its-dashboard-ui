"use client";

export default function TopBar() {
  return (
    <header className="bg-[#10131a]/80 backdrop-blur-md sticky top-0 w-full border-b border-white/10 z-40 shadow-2xl shadow-black/50 flex items-center justify-between px-6 h-16">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            search
          </span>
          <input
            className="w-full bg-transparent border border-outline-variant rounded pl-9 pr-3 py-1.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono-data text-mono-data placeholder-slate-500"
            placeholder="Search resources, zones, or alerts..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-slate-400">
          <button className="hover:text-white transition-colors scale-95 active:scale-90">
            <span className="material-symbols-outlined">notifications_active</span>
          </button>
          <button className="hover:text-white transition-colors scale-95 active:scale-90">
            <span className="material-symbols-outlined">dns</span>
          </button>
          <button className="hover:text-white transition-colors scale-95 active:scale-90">
            <span className="material-symbols-outlined">account_tree</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-xs text-primary font-mono font-['Space_Grotesk']">
              System Normal
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container border border-white/10 overflow-hidden">
            {/* Placeholder for profile image */}
            <div className="w-full h-full bg-surface-container" />
          </div>
        </div>
      </div>
    </header>
  );
}
