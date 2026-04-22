const events = [
  {
    time: "14:02:44",
    type: "COLLISION_MD",
    typeClass: "text-error",
    location: "I-95 @ Exit 22",
    status: "Critical",
    statusBg: "bg-error-container text-white",
  },
  {
    time: "14:01:12",
    type: "STALL_VEHICLE",
    typeClass: "text-tertiary",
    location: "Bridge Tunnel S",
    status: "Minor",
    statusBg: "bg-tertiary-container text-white",
  },
  {
    time: "13:58:20",
    type: "FLOW_DEGRADE",
    typeClass: "text-secondary",
    location: "Downtown Bypass",
    status: "Info",
    statusBg: "bg-surface-variant text-white",
  },
];

export default function LiveEventFeed() {
  return (
    <div className="bg-surface-container border border-white/10 rounded p-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline-md text-sm font-bold uppercase tracking-widest text-white">
          LIVE EVENT FEED
        </h3>
        <span className="text-[10px] text-slate-500 font-mono-data">AUTO-REFRESH: 5s</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-body-sm">
          <thead className="border-b border-white/5 text-slate-500">
            <tr>
              {["TIMESTAMP", "EVENT TYPE", "LOCATION", "STATUS", "ACTION"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-3 font-bold uppercase tracking-tighter ${i === 4 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((ev) => (
              <tr key={ev.time} className="hover:bg-white/5 transition-colors">
                <td className="py-3 font-mono-data text-slate-400">{ev.time}</td>
                <td className={`py-3 font-bold ${ev.typeClass}`}>{ev.type}</td>
                <td className="py-3 text-slate-300">{ev.location}</td>
                <td className="py-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${ev.statusBg}`}>
                    {ev.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-widest">
                    DETAILS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
