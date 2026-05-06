"use client";

/**
 * REQ-FR-005: Live feed panel — 10 most recent traffic events,
 * each showing location, event type, severity, and timestamp.
 * REQ-FR-016: Four severity levels — Informational / Warning / Critical / Emergency.
 */
import { useEffect, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";

interface FeedRow {
  id:        string;
  timestamp: string;
  type:      string;
  location:  string;
  severity:  string;
  sevClass:  string;
  sevBg:     string;
}

// REQ-FR-016: severity mapping from B2 congestion level
const SEVERITY: Record<string, { label: string; type: string; sevClass: string; sevBg: string }> = {
  LOW:      { label: "INFORMATIONAL", type: "FLOW_NORMAL",        sevClass: "text-slate-400",  sevBg: "bg-surface-variant text-slate-300" },
  MEDIUM:   { label: "WARNING",       type: "FLOW_DEGRADE",       sevClass: "text-yellow-400", sevBg: "bg-yellow-900/40 text-yellow-300" },
  HIGH:     { label: "CRITICAL",      type: "CONGESTION_HIGH",    sevClass: "text-error",      sevBg: "bg-error-container text-white" },
  CRITICAL: { label: "EMERGENCY",     type: "CONGESTION_CRITICAL",sevClass: "text-purple-400", sevBg: "bg-purple-900/60 text-purple-200" },
};

function metricToRow(m: TrafficMetric): FeedRow {
  const ts   = m.windowEnd ? new Date(m.windowEnd) : new Date();
  // REQ-DR-002: UTC timestamp with local offset
  const utc  = ts.toISOString().slice(11, 19) + " UTC";
  const sev  = SEVERITY[m.congestionLevel] ?? SEVERITY.LOW;
  return {
    id:        `${m.cameraId}-${m.windowEnd ?? Date.now()}`,
    timestamp: utc,
    type:      sev.type,
    location:  m.cameraId,
    severity:  sev.label,
    sevClass:  sev.sevClass,
    sevBg:     sev.sevBg,
  };
}

const PLACEHOLDER: FeedRow[] = [
  { id:"p1", timestamp:"—", type:"WAITING FOR DATA", location:"—", severity:"—", sevClass:"text-slate-600", sevBg:"bg-surface-variant text-slate-500" },
];

export default function LiveEventFeed() {
  const [rows, setRows]       = useState<FeedRow[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMetrics    = (data: TrafficMetric[]) =>
      setRows((prev) => [...data.map(metricToRow), ...prev].slice(0, 50)); // keep 50, display 10

    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("traffic:metrics", onMetrics);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("traffic:metrics", onMetrics);
    };
  }, []);

  // REQ-FR-005: display 10 most recent events
  const display = rows.length ? rows.slice(0, 10) : PLACEHOLDER;

  return (
    <div className="bg-surface-container border border-white/10 rounded p-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white">
          LIVE EVENT FEED
        </h3>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-yellow-400"}`} />
          <span className={`text-[10px] font-mono-data ${connected ? "text-emerald-400" : "text-yellow-400"}`}>
            {connected ? "LIVE · 5s" : "RECONNECTING…"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/5 text-slate-500">
            <tr>
              {["TIMESTAMP (UTC)", "EVENT TYPE", "LOCATION", "SEVERITY", "ACTION"].map((h, i) => (
                <th key={h} className={`pb-2 font-bold uppercase tracking-tight text-[10px] ${i === 4 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {display.map((ev) => (
              <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                <td className="py-2.5 font-mono-data text-slate-400 text-[10px]">{ev.timestamp}</td>
                <td className={`py-2.5 font-bold text-[11px] ${ev.sevClass}`}>{ev.type}</td>
                <td className="py-2.5 text-slate-300 font-mono-data text-[11px]">{ev.location}</td>
                <td className="py-2.5">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${ev.sevBg}`}>
                    {ev.severity}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-widest">
                    DETAILS
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[9px] font-mono-data text-slate-600">
        <span>SHOWING 10 OF {rows.length} EVENTS THIS SESSION</span>
        <span>AUTO-REFRESH · 5s INTERVAL</span>
      </div>
    </div>
  );
}
