export default function SideNavBar() {
  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col pt-16 bg-slate-950 dark:bg-[#0F1923] w-64 border-r border-slate-800 dark:border-white/10 z-40">
      {/* Header */}
      <div className="px-lg mb-xl">
        <span className="text-lg font-black text-blue-500 font-display-lg uppercase">
          Control Center
        </span>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] mt-1">
          District 4 – Metro
        </p>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-sm space-y-1">
        <a
          className="flex items-center gap-md px-md py-3 text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-[#1A2636] hover:text-slate-200 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </a>
        <a
          className="flex items-center gap-md px-md py-3 text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-[#1A2636] hover:text-slate-200 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span className="material-symbols-outlined">map</span>
          Maps
        </a>
        <a
          className="flex items-center gap-md px-md py-3 bg-blue-900/20 dark:bg-[#3B82F6]/10 text-blue-400 dark:text-[#3B82F6] border-l-2 border-blue-500 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            analytics
          </span>
          Analytics
        </a>
        <a
          className="flex items-center gap-md px-md py-3 text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-[#1A2636] hover:text-slate-200 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span className="material-symbols-outlined">notifications_active</span>
          Alerts
        </a>
      </nav>

      {/* Footer nav */}
      <div className="mt-auto pb-lg px-sm border-t border-white/5 pt-sm">
        <a
          className="flex items-center gap-md px-md py-3 text-slate-500 hover:text-slate-200 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span className="material-symbols-outlined">description</span>
          Documentation
        </a>
        <a
          className="flex items-center gap-md px-md py-3 text-slate-500 hover:text-slate-200 transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
          href="#"
        >
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </a>
      </div>
    </aside>
  );
}
