import AlertFilters from "@/components/alerts/AlertFilters";
import AlertTable from "@/components/alerts/AlertTable";
import AlertHistory from "@/components/alerts/AlertHistory";
import AlertDetailPanel from "@/components/alerts/AlertDetailPanel";

export default function AlertsPage() {
  return (
    <div className="ml-64 h-[calc(100vh-3.5rem)] flex overflow-hidden">
      <section className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-display-lg text-white font-semibold tracking-[-0.02em]">
              Alert Management
            </h2>
            <p className="text-body-sm text-outline mt-1">
              Real-time surveillance and incident validation protocol
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-surface-container-high border border-white/10 rounded-lg hover:bg-surface-bright transition-colors text-body-sm font-semibold">
              <span className="material-symbols-outlined mr-2 text-primary text-sm">download</span>
              Export CSV
            </button>
            <button className="flex items-center px-4 py-2 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity text-body-sm font-bold uppercase tracking-tight">
              <span
                className="material-symbols-outlined mr-2 text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                done_all
              </span>
              Acknowledge Selected
            </button>
          </div>
        </div>

        <AlertFilters />
        <AlertTable />
        <AlertHistory />
      </section>

      <AlertDetailPanel />
    </div>
  );
}
