const actions = [
  { icon: "videocam_off", label: "Reboot Camera", hoverColor: "hover:border-primary/50 hover:bg-primary/5", iconClass: "text-primary" },
  { icon: "speed",        label: "Apply Slowdown", hoverColor: "hover:border-error/50 hover:bg-error/5",   iconClass: "text-error" },
  { icon: "broadcast_on_home", label: "Update VMS", hoverColor: "hover:border-tertiary/50 hover:bg-tertiary/5", iconClass: "text-tertiary" },
  { icon: "refresh",      label: "Sync Sensors",   hoverColor: "hover:border-white/50 hover:bg-white/5",  iconClass: "text-slate-400" },
];

const statusItems = [
  { label: "API Connection", value: "22ms" },
  { label: "Model Latency",  value: "104ms" },
];

export default function SystemActions() {
  return (
    <div className="bg-surface-container border border-white/10 rounded p-md">
      <h3 className="font-headline-md text-sm font-bold uppercase tracking-widest text-white mb-4">
        SYSTEM ACTIONS
      </h3>

      <div className="grid grid-cols-2 gap-sm">
        {actions.map(({ icon, label, hoverColor, iconClass }) => (
          <button
            key={label}
            className={`flex flex-col items-center justify-center gap-2 p-4 bg-surface-container-high border border-white/5 rounded transition-all group ${hoverColor}`}
          >
            <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${iconClass}`}>
              {icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {statusItems.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between p-3 bg-surface-container-lowest rounded border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium uppercase">{label}</span>
            </div>
            <span className="text-[10px] font-mono-data text-slate-500">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
