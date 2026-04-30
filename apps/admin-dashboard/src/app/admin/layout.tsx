import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";
import AlertBanner from "@/components/admin/AlertBanner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (fixed left, w-64) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-64 flex flex-col min-h-screen w-full">
        {/* TopBar (sticky top) */}
        <TopBar />

        {/* AlertBanner (below topbar) */}
        <AlertBanner />

        {/* Page content area (scrollable) */}
        <main className="flex-1 p-margin flex flex-col gap-margin overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
