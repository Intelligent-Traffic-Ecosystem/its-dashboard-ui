export default function AlertDetailPanel() {
  return (
    <aside className="w-[400px] bg-[#1A2636] border-l border-white/10 flex flex-col overflow-y-auto flex-shrink-0">
      {/* Live camera feed */}
      <div className="aspect-video bg-black relative group">
        <img
          className="w-full h-full object-cover opacity-80"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3zqwdtTfWyqv4PF6npv-z-rilPYhTi5lvaezpod9_f3JGrtx9U-Da8pixukpyCK8nQ7y0ZingUrdNi_qNVsJMJlghorGNRS75C87S1lx4bQr_JjITQfMGWfm7Top0VTK2AUX4lEXH_iLryJ0EyplLrWcq4MiCaviGqgnH0sTp6nlO-o41V_pQh9RBuSTegBrIbSrofLqmmd1yJCoe1bakJTRKp5G_txv8mZvQF2Q-3kwip7Zu_QtXnJv3zNxJ316XW9WJJe0ogRg"
          alt="Live Traffic Feed"
        />
        <div className="absolute top-3 left-3 flex space-x-2">
          <span className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase rounded animate-pulse text-white">
            LIVE FEED
          </span>
          <span className="px-2 py-0.5 bg-black/60 text-[10px] uppercase font-mono-data rounded text-white">
            CAM_NORTH_042
          </span>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="material-symbols-outlined text-white cursor-pointer hover:scale-110 transition-transform">
            fullscreen
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="px-2 py-1 bg-red-900/40 text-red-400 text-[10px] font-black rounded uppercase tracking-widest border border-red-500/20">
              Critical Alert
            </span>
            <h3 className="font-headline-md text-headline-md text-white mt-2">#TRF-9921</h3>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-outline">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Detection Source</p>
            <p className="text-body-md font-semibold text-primary">YOLO v8 Engine</p>
          </div>
          <div className="bg-surface-container-low p-3 rounded border border-white/5">
            <p className="text-[10px] uppercase text-outline font-bold mb-1">Affected Lanes</p>
            <p className="text-body-md font-semibold text-on-surface">Lanes 1, 2, 4</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-2">Detailed Description</p>
          <p className="text-body-md text-on-surface leading-relaxed">
            AI module detected a passenger vehicle moving in the opposite direction of traffic flow.
            Vehicle entered through Exit 42 ramp incorrectly. Immediate dispatch suggested.
          </p>
        </div>

        {/* Audit trail */}
        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-3 flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-1">receipt_long</span>
            Audit Trail
          </p>
          <div className="space-y-4 border-l border-white/10 ml-2 pl-4">
            <div className="relative">
              <span className="absolute -left-[21px] top-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1A2636]" />
              <p className="text-xs font-bold text-white uppercase">Alert Triggered</p>
              <p className="text-[11px] text-outline">14:22:01 – System AI</p>
            </div>
            <div className="relative opacity-60">
              <span className="absolute -left-[21px] top-1 w-2 h-2 bg-outline rounded-full border-2 border-[#1A2636]" />
              <p className="text-xs font-bold text-white uppercase">Waiting for Acknowledge</p>
              <p className="text-[11px] text-outline">Pending – Operator_042</p>
            </div>
          </div>
        </div>

        {/* Assign to zone */}
        <div>
          <p className="text-[10px] uppercase text-outline font-bold mb-2">Assign to Zone</p>
          <select className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none">
            <option>Select Zone Unit...</option>
            <option>Zone 4 Patrol – Unit 1</option>
            <option>Zone 4 Patrol – Unit 5</option>
            <option>Express Emergency Services</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
          <button className="py-3 bg-surface-container-high border border-white/10 text-white rounded-lg font-bold uppercase text-xs hover:bg-surface-bright transition-colors">
            Dismiss
          </button>
          <button className="py-3 bg-primary-container text-on-primary-container rounded-lg font-bold uppercase text-xs hover:opacity-90 transition-opacity">
            Acknowledge
          </button>
        </div>
      </div>
    </aside>
  );
}
