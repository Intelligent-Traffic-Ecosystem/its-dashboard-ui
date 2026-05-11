"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Live Map", icon: Map },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-14 bottom-0 z-20 w-56 flex-col gap-1 px-3 py-5"
        style={{
          background: "#0D1018",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#757780" }}
        >
          Public Portal
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: active ? "#ffffff" : "#757780",
                background: active ? "rgba(59,130,246,0.08)" : "transparent",
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: "#3B82F6" }}
                />
              )}
              <Icon size={16} style={{ color: active ? "#4CD7F6" : "#757780" }} />
              {label}
            </Link>
          );
        })}

        <div
          className="mt-auto pt-4 px-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] leading-relaxed" style={{ color: "#757780" }}>
            Read-only public view.
            <br />
            Data refreshes every 30s.
          </p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex"
        style={{
          background: "#0D1018",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition-colors"
              style={{ color: active ? "#4CD7F6" : "#757780" }}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
