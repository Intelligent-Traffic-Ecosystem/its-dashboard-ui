"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const loginAppUrl = process.env.NEXT_PUBLIC_LOGIN_APP_URL || "http://localhost:3003";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/maps", icon: "map", label: "Maps" },
  { href: "/analytics", icon: "analytics", label: "Analytics" },
  { href: "/alerts", icon: "notifications_active", label: "Alerts" },
];

export default function SideNavBar() {
  const pathname = usePathname();

  async function handleLogout() {
    try {
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = loginAppUrl;
    } catch (err) {
      console.error("Logout error", err);
      window.location.href = loginAppUrl;
    }
  }

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen flex flex-col pt-16 bg-slate-950 dark:bg-[#0F1923] w-64 border-r border-slate-800 dark:border-white/10 z-40">
        {/* Brand */}
        <div className="px-lg mb-xl">
          <span className="text-lg font-black text-blue-500 font-display-lg uppercase">
            Control Center
          </span>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em] mt-1">
            District 4 – Metro
          </p>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-0 space-y-1">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-6 py-3 border-l-2 font-display-lg text-xs font-medium uppercase tracking-widest transition-all ${active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-slate-500 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer nav */}
        <div className="mt-auto pb-lg px-0 border-t border-white/10 pt-sm">
          <a
            className="flex items-center gap-3 px-6 py-3 text-slate-500 hover:bg-white/5 hover:text-white transition-all font-display-lg text-xs font-medium uppercase tracking-widest"
            href="#"
          >
            <span className="material-symbols-outlined">help</span>
            Support
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-slate-500 hover:bg-white/5 hover:text-white transition-all font-display-lg text-xs font-medium uppercase tracking-widest text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
