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
      {/* Offset for fixed top nav (h-14) and sidebar (w-56) */}
      <main className="ml-56 mt-14 min-h-[calc(100vh-3.5rem)] bg-zinc-950 p-6">
        {(title || actions) && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </>
  );
}
