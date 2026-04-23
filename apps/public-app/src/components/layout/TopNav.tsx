"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Live Map" },
  { href: "/incidents", label: "Incidents" },
];

export function TopNav() {
  const pathname = usePathname();

  const currentPage = NAV_LINKS.find(
    (l) => pathname === l.href || pathname.startsWith(l.href + "/")
  );

  return (
    <header
      className="fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 md:px-6"
      style={{
        background: "#0D1018",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div
          className="flex size-7 items-center justify-center rounded-md"
          style={{ background: "rgba(59,130,246,0.12)", outline: "1px solid rgba(59,130,246,0.3)" }}
        >
          <Activity size={14} className="text-primary" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            TRAFFIC<span className="text-secondary">_OPS</span>
          </span>
          <span className="text-[9px] font-semibold tracking-widest uppercase text-secondary opacity-80">
            Public View
          </span>
        </div>
      </Link>

      {/* Desktop nav — hidden on mobile */}
      <nav className="hidden md:flex items-center gap-0.5">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="relative px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: active ? "#ffffff" : "#757780" }}
            >
              {label}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "#3B82F6" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: page title on mobile + live indicator */}
      <div className="flex items-center gap-3">
        {currentPage && (
          <span
            className="md:hidden text-xs font-semibold uppercase tracking-widest text-neutral"
          >
            {currentPage.label}
          </span>
        )}
        <LiveIndicator />
        <span className="hidden md:block text-xs text-neutral">Colombo Metro</span>
      </div>
    </header>
  );
}
