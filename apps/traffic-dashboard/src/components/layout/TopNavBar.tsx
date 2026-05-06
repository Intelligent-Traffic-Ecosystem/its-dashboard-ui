"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getSocket, type TrafficAlert } from "@/lib/socket";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Historical Analytics" },
  { href: "/reports",   label: "Reports" },
];

export default function TopNavBar() {
  const pathname = usePathname();
  const [connected, setConnected]   = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onAlert      = (_: TrafficAlert) => setAlertCount((n) => n + 1);

    socket.on("connect",    onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("alert:new",  onAlert);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect",    onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("alert:new",  onAlert);
    };
  }, []);

  return (
    <header className="flex justify-between items-center h-14 px-4 w-full sticky top-0 z-50 bg-slate-900 dark:bg-[#1A2636] border-b border-slate-800 dark:border-white/10">
      {/* Brand + Search */}
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tighter text-slate-100 font-display-lg">
            TRAFFIC_OPS AI
          </span>
          {/* Socket.IO connection indicator */}
          <span
            title={connected ? "Connected to B3 backend" : "Disconnected — reconnecting…"}
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${connected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-yellow-400 animate-pulse"}`}
          />
        </div>
        <div className="ml-xl flex items-center bg-surface-container-low px-sm py-1 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-body-sm text-on-surface-variant w-48 outline-none ml-1"
            placeholder="Search system assets…"
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
          {/* Alert badge */}
          <button className="relative material-symbols-outlined hover:bg-white/5 p-2 rounded transition-colors">
            notifications
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
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
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-all bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
