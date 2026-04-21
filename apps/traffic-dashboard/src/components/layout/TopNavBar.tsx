"use client";

export default function TopNavBar() {
  return (
    <header className="flex justify-between items-center h-14 px-4 w-full sticky top-0 z-50 bg-slate-900 dark:bg-[#1A2636] border-b border-slate-800 dark:border-white/10">
      {/* Brand + Search */}
      <div className="flex items-center gap-md">
        <span className="text-xl font-bold tracking-tighter text-slate-100 font-display-lg">
          TRAFFIC_OPS AI
        </span>
        <div className="ml-xl flex items-center bg-surface-container-low px-sm py-1 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-outline text-sm">
            search
          </span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface-variant w-48 outline-none ml-1"
            placeholder="Global search..."
            type="text"
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-lg">
        <button className="text-slate-400 font-display-lg text-sm tracking-tight hover:bg-slate-800 dark:hover:bg-[#243447] transition-colors px-2 py-1">
          Dashboard
        </button>
        <button className="text-blue-400 dark:text-[#3B82F6] border-b-2 border-blue-500 font-display-lg text-sm tracking-tight px-2 py-1">
          Historical Analytics
        </button>
        <button className="text-slate-400 font-display-lg text-sm tracking-tight hover:bg-slate-800 dark:hover:bg-[#243447] transition-colors px-2 py-1">
          Reports
        </button>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-md">
        <button className="material-symbols-outlined text-on-surface-variant hover:bg-slate-800 dark:hover:bg-[#243447] p-1 rounded transition-colors">
          notifications
        </button>
        <button className="material-symbols-outlined text-on-surface-variant hover:bg-slate-800 dark:hover:bg-[#243447] p-1 rounded transition-colors">
          settings
        </button>
        <button className="material-symbols-outlined text-on-surface-variant hover:bg-slate-800 dark:hover:bg-[#243447] p-1 rounded transition-colors">
          help
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center border border-primary overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9-znyvCDCL236mgoMpJszPgshZaB-GO34km9gJ2XjEhOF_oY60pwVnWvepTTSNpfYy23_IoHffToyhpjsw6vARVAbxBzYprPou3VduG95nZM_Yl6QUjkRsUx5F8wMvmTRbMRz7FOJ1NWOn70-oap0FBjBOeQVxDH327tuAPRRNqdXaEQOnIfwXsq3ImAZIT7xovw85HLik878jj_ix9D0-IVMWk2Sh-hmQnnsbReRteUEcFyO0nfBLPeaVEs93Vn3MyJ-ScMPGdg"
            alt="Admin"
          />
        </div>
      </div>
    </header>
  );
}
