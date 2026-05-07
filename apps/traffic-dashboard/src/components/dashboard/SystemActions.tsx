"use client";

/**
 * REQ-DR-004: Data staleness indicator.
 * REQ-NFR-008: Degraded-mode notice when upstream is unavailable.
 */
import { useEffect, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import { useB3Health } from "@/lib/hooks/useB3Backend";

const ACTIONS = [
  { icon: "videocam_off",      label: "Reboot Camera",  hoverColor: "hover:border-primary/50 hover:bg-primary/5",   iconClass: "text-primary" },
  { icon: "speed",             label: "Apply Slowdown", hoverColor: "hover:border-error/50 hover:bg-error/5",       iconClass: "text-error" },
  { icon: "broadcast_on_home", label: "Update VMS",     hoverColor: "hover:border-tertiary/50 hover:bg-tertiary/5", iconClass: "text-tertiary" },
  { icon: "refresh",           label: "Sync Sensors",   hoverColor: "hover:border-white/50 hover:bg-white/5",       iconClass: "text-slate-400" },
];

export default function SystemActions() {
  const { data: health, error: healthError } = useB3Health();
  const [connected, setConnected]   = useState(false);
  const [latency, setLatency]       = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [stale, setStale]           = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      // measure round-trip latency
      const t0 = Date.now();
      socket.emit("ping");
      socket.once("pong", () => setLatency(Date.now() - t0));
    };
    const onDisconnect = () => { setConnected(false); setLatency(null); };

    const onMetrics = (data: TrafficMetric[]) => {
      if (!data.length) return;
      const latest = data
        .map((m) => (m.windowEnd ? new Date(m.windowEnd).getTime() : 0))
        .reduce((a, b) => Math.max(a, b), 0);
      if (latest > 0) setLastUpdate(latest);
    };

    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("traffic:metrics", onMetrics);
    queueMicrotask(() => setConnected(socket.connected));

    // REQ-DR-004: poll for staleness every 5s
    const staleTimer = setInterval(() => {
      setStale((prev) => {
        if (lastUpdate === null) return prev;
        return Date.now() - lastUpdate > 30_000;
      });
    }, 5_000);

    return () => {
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("traffic:metrics", onMetrics);
      clearInterval(staleTimer);
    };
  }, [lastUpdate]);

  const statusItems = [
    {
      label: "B3 Backend",
      value: healthError ? "unreachable" : health ? (latency !== null ? `${latency}ms` : health.status) : connected ? "connected" : "checking",
      ok: !healthError && (connected || health?.status === "ok" || health?.status === "degraded"),
      warn: health?.status === "degraded",
    },
    {
      label: "Data Feed",
      // REQ-DR-004: stale indicator
      value: !connected ? "no connection" : stale ? "STALE >30s" : lastUpdate ? "live" : health?.upstream?.b2?.status ?? "waiting",
      ok: connected && !stale && (lastUpdate !== null || health?.upstream?.b2?.status === "ok"),
      warn: stale || health?.upstream?.b2?.status === "unreachable",
    },
  ];

  return (
    <div className="bg-surface-container border border-white/10 rounded p-md">
      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">
        SYSTEM ACTIONS
      </h3>

      <div className="grid grid-cols-2 gap-sm">
        {ACTIONS.map(({ icon, label, hoverColor, iconClass }) => (
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
        {statusItems.map(({ label, value, ok, warn }) => (
          <div
            key={label}
            className={`flex items-center justify-between p-3 rounded border ${
              warn ? "bg-yellow-900/20 border-yellow-500/30" :
              ok   ? "bg-surface-container-lowest border-white/5" :
                     "bg-red-900/20 border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${warn ? "bg-yellow-400" : ok ? "bg-emerald-400" : "bg-red-500"}`} />
              <span className="text-[11px] font-medium uppercase">{label}</span>
            </div>
            <span className={`text-[10px] font-mono-data ${warn ? "text-yellow-400" : ok ? "text-slate-400" : "text-red-400"}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* REQ-NFR-008: degraded mode notice */}
      {!connected && (
        <p className="mt-4 text-[10px] text-yellow-400 font-mono-data text-center border border-yellow-500/30 rounded p-2">
          ⚠ DEGRADED MODE — serving last cached state
        </p>
      )}
    </div>
  );
}
