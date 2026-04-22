const history = [
  {
    icon: "check_circle",
    iconClass: "text-green-500",
    title: "TRF-9870 Resolved",
    desc: "Stalled Vehicle cleared @ 13:10",
    operator: "Operator: J. Carter",
  },
  {
    icon: "check_circle",
    iconClass: "text-green-500",
    title: "TRF-9865 Acknowledged",
    desc: "Congestion report @ 12:45",
    operator: "Operator: System AI",
  },
  {
    icon: "cancel",
    iconClass: "text-slate-500",
    title: "TRF-9861 Dismissed",
    desc: "False positive: Camera Glitch",
    operator: "Operator: R. Singh",
  },
];

export default function AlertHistory() {
  return (
    <div className="border-t border-white/10 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-title-sm text-white flex items-center font-semibold">
          <span className="material-symbols-outlined mr-2 text-outline">history</span>
          Recent History (Past 2 Hours)
        </h3>
        <button className="text-primary text-xs font-bold uppercase hover:opacity-80">
          View Full Archive
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {history.map((item) => (
          <div
            key={item.title}
            className="p-4 bg-surface-container border border-white/5 rounded-lg flex items-start space-x-3"
          >
            <span className={`material-symbols-outlined flex-shrink-0 ${item.iconClass}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-xs font-bold text-white uppercase">{item.title}</p>
              <p className="text-[11px] text-outline">{item.desc}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono-data">
                {item.operator}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
