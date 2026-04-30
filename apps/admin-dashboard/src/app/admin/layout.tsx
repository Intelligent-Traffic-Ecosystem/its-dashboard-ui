import SideNavBar from "@/components/layout/SideNavBar";
import TopNavBar from "@/components/layout/TopNavBar";
import CriticalAlertBanner from "@/components/ui/CriticalAlertBanner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (fixed left, w-64) */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="ml-64 flex flex-col min-h-screen w-full">
        {/* TopBar (sticky top) */}
        <TopNavBar />

        {/* AlertBanner (below topbar) */}
        <CriticalAlertBanner />

        {/* Page content area (scrollable) */}
        <main className="flex-1 p-margin flex flex-col gap-margin overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
