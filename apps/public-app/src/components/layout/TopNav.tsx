import Link from "next/link";
import { Activity } from "lucide-react";
import { LiveIndicator } from "@/components/ui/LiveIndicator";

export function TopNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-6 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div className="flex size-7 items-center justify-center rounded-md bg-cyan-500/10 ring-1 ring-cyan-500/30">
          <Activity size={15} className="text-cyan-400" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          ITS&nbsp;<span className="text-cyan-400">Public</span>
        </span>
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/map", label: "Live Map" },
          { href: "/incidents", label: "Incidents" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Live indicator */}
      <LiveIndicator />
    </header>
  );
}
