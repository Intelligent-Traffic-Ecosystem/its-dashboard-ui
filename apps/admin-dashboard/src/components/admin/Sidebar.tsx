"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  icon: string;
  href: string;
  fillWhenActive?: boolean;
}

const navItems: NavItem[] = [
  { label: "Overview", icon: "dashboard", href: "/" },
  { label: "Live Map", icon: "map", href: "/map" },
  { label: "Alerts", icon: "notifications_active", href: "/alerts" },
  { label: "Analytics", icon: "analytics", href: "/analytics" },
  { label: "Alert Configuration", icon: "settings_input_component", href: "/alert-config" },
  { label: "Zone Management", icon: "layers", href: "/zones" },
  { label: "Broadcast Message", icon: "campaign", href: "/broadcast", fillWhenActive: true },
  { label: "Active Sessions", icon: "supervised_user_circle", href: "/sessions", fillWhenActive: true },
  { label: "Settings", icon: "settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Keycloak logout URL or login page
        if (data.logoutUrl) {
          window.location.href = data.logoutUrl;
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: redirect to login page
      const loginAppUrl = process.env.NEXT_PUBLIC_LOGIN_APP_URL || "http://localhost:3003";
      window.location.href = `${loginAppUrl}`;
    }
  };

  return (
    <nav className="bg-[#10131a] fixed left-0 top-0 h-full w-64 border-r border-white/10 shadow-none flex flex-col py-6 z-50">
      {/* Brand/Header */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center border border-white/10">
            <span
              className="material-symbols-outlined text-[#3B82F6]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-white font-['Space_Grotesk']">
              ITMS Admin
            </h1>
            <p className="text-xs text-slate-400 font-body-sm text-body-sm">
              Infrastructure Control
            </p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container border border-error/20">
          <span className="font-label-caps text-label-caps">Administrator</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-r font-['Space_Grotesk'] text-sm tracking-wide uppercase transition-all duration-150 ease-in-out ${
                active
                  ? "border-l-2 border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6] font-bold"
                  : "text-slate-500 hover:bg-white/5 transition-colors"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={
                  active && item.fillWhenActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-white/5 hover:text-slate-100 transition-colors font-['Space_Grotesk'] text-sm tracking-wide uppercase"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span>Support</span>
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-white/5 hover:text-slate-100 transition-colors font-['Space_Grotesk'] text-sm tracking-wide uppercase cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
