export default function OverviewPage() {
  return (
    <>
      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Active Incidents</span>
            <span className="material-symbols-outlined text-[20px]">report</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">12</div>
          <div className="font-body-sm text-body-sm text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +2 since last hour
          </div>
        </div>
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Avg Speed</span>
            <span className="material-symbols-outlined text-[20px]">speed</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            58 <span className="text-title-sm text-on-surface-variant">km/h</span>
          </div>
          <div className="font-body-sm text-body-sm text-emerald-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +5% vs avg
          </div>
        </div>
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Congestion Level</span>
            <span className="material-symbols-outlined text-[20px]">traffic</span>
          </div>
          <div className="font-display-lg text-display-lg text-tertiary-container">Elevated</div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">City Center Area</div>
        </div>
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="font-label-caps text-label-caps">Active Alerts</span>
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">143</div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">Across 18 zones</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-margin">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline-md text-headline-md text-on-surface">Traffic Volume</h3>
            <div className="flex bg-surface-variant rounded border border-outline-variant p-1">
              <button className="px-3 py-1 bg-surface-container text-on-surface rounded shadow-sm font-label-caps text-label-caps">
                60 Min
              </button>
              <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface rounded font-label-caps text-label-caps">
                24 Hr
              </button>
              <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface rounded font-label-caps text-label-caps">
                7 Days
              </button>
            </div>
          </div>
          <div className="flex-1 relative min-h-[300px] w-full border-b border-l border-white/10 pl-2 pb-2">
            {/* Mock Chart Elements */}
            <div
              className="absolute bottom-0 left-0 w-full h-[60%] bg-primary/20"
              style={{
                clipPath:
                  "polygon(0 100%, 10% 80%, 20% 85%, 30% 60%, 40% 70%, 50% 40%, 60% 50%, 70% 20%, 80% 30%, 90% 10%, 100% 20%, 100% 100%)",
              }}
            ></div>
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <polyline
                fill="none"
                points="0,100 10,80 20,85 30,60 40,70 50,40 60,50 70,20 80,30 90,10 100,20"
                stroke="#adc6ff"
                strokeWidth="0.5"
              />
            </svg>
            {/* Y-Axis Labels */}
            <div className="absolute left-[-30px] top-0 h-full flex flex-col justify-between font-mono-data text-mono-data text-on-surface-variant text-[10px]">
              <span>10k</span>
              <span>7.5k</span>
              <span>5k</span>
              <span>2.5k</span>
              <span>0</span>
            </div>
            {/* X-Axis Labels */}
            <div className="absolute bottom-[-20px] left-0 w-full flex justify-between font-mono-data text-mono-data text-on-surface-variant text-[10px] pl-4">
              <span>-60m</span>
              <span>-45m</span>
              <span>-30m</span>
              <span>-15m</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* Feed Area */}
        <div className="bg-surface-container border border-white/10 rounded-lg p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Live Event Feed</h3>
            <button className="text-primary hover:text-primary-fixed transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {/* Event 1 */}
            <div className="p-3 bg-surface border border-white/5 rounded flex gap-3 hover:bg-surface-variant transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded bg-error-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-error text-[18px]">car_crash</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-error">Collision</span>
                  <span className="font-mono-data text-mono-data text-on-surface-variant text-[10px]">
                    Just now
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                  Multi-vehicle collision reported on I-95 N.
                </p>
              </div>
            </div>
            {/* Event 2 */}
            <div className="p-3 bg-surface border border-white/5 rounded flex gap-3 hover:bg-surface-variant transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded bg-tertiary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-tertiary-container text-[18px]">
                  construction
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-tertiary-container">
                    Work Zone
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface-variant text-[10px]">
                    2m ago
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                  Lane closure initiated for scheduled maintenance.
                </p>
              </div>
            </div>
            {/* Event 3 */}
            <div className="p-3 bg-surface border border-white/5 rounded flex gap-3 hover:bg-surface-variant transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[18px]">sensors</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-primary">Sensor Alert</span>
                  <span className="font-mono-data text-mono-data text-on-surface-variant text-[10px]">
                    14m ago
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface leading-snug">
                  Camera 4B connection degraded. Attempting reconnect.
                </p>
              </div>
            </div>
            {/* Event 4 */}
            <div className="p-3 bg-surface border border-white/5 rounded flex gap-3 hover:bg-surface-variant transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  check_circle
                </span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    Cleared
                  </span>
                  <span className="font-mono-data text-mono-data text-on-surface-variant text-[10px]">
                    22m ago
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                  Debris removed from Route 1 Southbound.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
