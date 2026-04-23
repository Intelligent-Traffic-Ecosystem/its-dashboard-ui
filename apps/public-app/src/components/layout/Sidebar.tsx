"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, AlertTriangle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Live Map", icon: Map },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-20 w-56 flex flex-col gap-1 px-3 py-4 bg-zinc-950 border-r border-zinc-800">
      <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        Navigation
      </p>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}

      {/* Footer */}
      <div className="mt-auto border-t border-zinc-800 pt-4 px-3">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Read-only public view.
          <br />
          Data refreshes every 30s.
        </p>
      </div>
    </aside>
  );
}
