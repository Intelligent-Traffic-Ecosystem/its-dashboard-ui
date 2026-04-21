export default function FABOverlay() {
  return (
    <div className="fixed bottom-lg right-lg group">
      <button className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
      <div className="absolute bottom-16 right-0 flex flex-col gap-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
        <button className="bg-surface-container-highest px-md py-2 rounded-lg text-body-sm whitespace-nowrap shadow-xl border border-white/10">
          Schedule Report
        </button>
        <button className="bg-surface-container-highest px-md py-2 rounded-lg text-body-sm whitespace-nowrap shadow-xl border border-white/10">
          Configure Alerts
        </button>
      </div>
    </div>
  );
}
