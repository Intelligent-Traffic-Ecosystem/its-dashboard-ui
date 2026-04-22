"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Historical Analytics" },
  { href: "/reports",   label: "Reports" },
];

export default function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center h-14 px-4 w-full sticky top-0 z-50 bg-slate-900 dark:bg-[#1A2636] border-b border-slate-800 dark:border-white/10">
      {/* Brand + Search */}
      <div className="flex items-center gap-md">
        <span className="text-xl font-bold tracking-tighter text-slate-100 font-display-lg">
          TRAFFIC_OPS AI
        </span>
        <div className="ml-xl flex items-center bg-surface-container-low px-sm py-1 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface-variant w-48 outline-none ml-1"
            placeholder="Search system assets..."
            type="text"
          />
        </div>
      </div>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-lg">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`font-display-lg text-sm tracking-tight px-2 py-1 transition-colors ${
                active
                  ? "text-blue-400 dark:text-[#3B82F6] border-b-2 border-blue-500"
                  : "text-slate-400 hover:bg-slate-800 dark:hover:bg-[#243447]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-4 text-slate-400">
          <button className="material-symbols-outlined hover:bg-white/5 p-2 rounded transition-colors">
            notifications
          </button>
          <button className="material-symbols-outlined hover:bg-white/5 p-2 rounded transition-colors">
            settings
          </button>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-xs font-bold text-white uppercase tracking-tighter">OP_ALPHA_09</p>
            <p className="text-[10px] text-primary uppercase">Chief Engineer</p>
          </div>
          <img
            className="w-10 h-10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-all"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdlxYLOcPjQ2Hwy9SNIxqbkFtzitv33sJ6xnK9He2-jeIRshfrX4Toggr36L7aEIburyJaPaAupxVeJ9XbWpsddybaL5p7oCi32j0_ZzcZte7GGsUAu7aw6_e5_Iz7lbvCKISnaehVPPynnrxmi1Z47NWqN0jhcF9zDm8-rtGFXdGYj2igu7zE327xQyEM-FBn7EMSngtNL_MaUXWCjRk-iVQ8ZSWnyma64Spbx4ENSowRzfS6kIdnQUl3yz_-q0nELwDR_i8ZYdg"
            alt="Operator"
          />
        </div>
      </div>
    </header>
  );
}
