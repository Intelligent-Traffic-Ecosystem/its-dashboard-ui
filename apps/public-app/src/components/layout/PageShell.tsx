import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageShell({
  children,
  title,
  subtitle,
  actions,
}: PageShellProps) {
  return (
    <>
      <TopNav />
      <Sidebar />
      {/* Offset: fixed top nav (h-14) + desktop sidebar (md:ml-56) + mobile tab bar (pb-16) */}
      <main className="mt-14 md:ml-56 min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0 p-4 md:p-6" style={{ background: "#0F1117" }}>
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 max-w-3xl">
              {title && (
                <h1
                  className="text-2xl md:text-3xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#757780" }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </>
  );
}
