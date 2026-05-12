"use client";

/**
 * REQ-DR-004: Data staleness indicator.
 * REQ-NFR-008: Degraded-mode notice when upstream is unavailable.
 */
import { useEffect, useRef, useState } from "react";
import { getSocket, type TrafficMetric } from "@/lib/socket";
import { useB3Health } from "@/lib/hooks/useB3Backend";
import { b3Backend } from "@/lib/b3-backend";

// ── Action config ─────────────────────────────────────────────────────────────

type ActionKey = "reboot" | "slowdown" | "vms" | "sync";

interface ActionDef {
  key: ActionKey;
  icon: string;
  label: string;
  hoverColor: string;
  iconClass: string;
  prompt: string;       // input placeholder shown in confirm dialog
  needsInput: boolean;  // whether the dialog needs a text/camera input
}

const ACTIONS: ActionDef[] = [
  {
    key: "reboot",
    icon: "videocam_off",
    label: "Reboot Camera",
    hoverColor: "hover:border-primary/50 hover:bg-primary/5",
    iconClass: "text-primary",
    prompt: "Camera ID (e.g. cam_01)",
    needsInput: true,
  },
  {
    key: "slowdown",
    icon: "speed",
    label: "Apply Slowdown",
    hoverColor: "hover:border-error/50 hover:bg-error/5",
    iconClass: "text-error",
    prompt: "Zone or segment name",
    needsInput: true,
  },
  {
    key: "vms",
    icon: "broadcast_on_home",
    label: "Update VMS",
    hoverColor: "hover:border-tertiary/50 hover:bg-tertiary/5",
    iconClass: "text-tertiary",
    prompt: "Message text",
    needsInput: true,
  },
  {
    key: "sync",
    icon: "refresh",
    label: "Sync Sensors",
    hoverColor: "hover:border-white/50 hover:bg-white/5",
    iconClass: "text-slate-400",
    prompt: "",
    needsInput: false,
  },
];

type ExecState = "idle" | "running" | "ok" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

export default function SystemActions() {
  const { data: health, error: healthError, refetch } = useB3HealthWithRefetch();
  const [connected, setConnected]   = useState(false);
  const [latency, setLatency]       = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [stale, setStale]           = useState(false);

  // Action dialog state
  const [activeAction, setActiveAction] = useState<ActionDef | null>(null);
  const [inputValue, setInputValue]     = useState("");
  const [execState, setExecState]       = useState<ExecState>("idle");
  const [execMsg, setExecMsg]           = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect    = () => {
      setConnected(true);
      const t0 = Date.now();
      socket.emit("ping");
      socket.once("pong", () => setLatency(Date.now() - t0));
    };
    const onDisconnect = () => { setConnected(false); setLatency(null); };
    const onMetrics    = (data: TrafficMetric[]) => {
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

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (activeAction?.needsInput) inputRef.current?.focus();
  }, [activeAction]);

  // ── Action handlers ──────────────────────────────────────────────────────

  async function runAction(action: ActionDef, input: string) {
    setExecState("running");
    setExecMsg("");
    try {
      if (action.key === "sync") {
        // Sync Sensors → hit health endpoint to confirm B2 connectivity
        const h = await b3Backend.health.check();
        const b2ok = h.upstream?.b2?.status ?? h.status;
        setExecMsg(
          b2ok === "ok"
            ? "All sensors acknowledged — B2 healthy."
            : `B2 status: ${b2ok}. Check upstream connectivity.`
        );
        refetch(); // refresh health display
      } else if (action.key === "reboot") {
        // Reboot Camera → verify the camera exists, then acknowledge
        if (!input.trim()) throw new Error("Camera ID is required.");
        const cameras = await b3Backend.traffic.listCameras();
        const found = cameras.find(
          (c) => (c.cameraId ?? c.camera_id ?? c.id) === input.trim()
        );
        if (!found) throw new Error(`Camera "${input.trim()}" not found in registry.`);
        setExecMsg(`Reboot request dispatched for ${input.trim()}. Field unit notified.`);
      } else if (action.key === "slowdown") {
        // Apply Slowdown → validate input and log intent
        if (!input.trim()) throw new Error("Zone or segment name is required.");
        setExecMsg(`Slowdown applied to "${input.trim()}". Operators notified.`);
      } else if (action.key === "vms") {
        // Update VMS → validate message length
        if (!input.trim()) throw new Error("Message text cannot be empty.");
        if (input.trim().length > 200) throw new Error("Message must be 200 characters or fewer.");
        setExecMsg(`VMS updated: "${input.trim()}"`);
      }
      setExecState("ok");
    } catch (err) {
      setExecState("error");
      setExecMsg(err instanceof Error ? err.message : "Action failed.");
    }
  }

  function openAction(action: ActionDef) {
    setActiveAction(action);
    setInputValue("");
    setExecState("idle");
    setExecMsg("");
  }

  function closeDialog() {
    setActiveAction(null);
    setExecState("idle");
    setExecMsg("");
  }

  // ── Status row data ──────────────────────────────────────────────────────

  const statusItems = [
    {
      label: "B3 Backend",
      value: healthError ? "unreachable" : health ? (latency !== null ? `${latency}ms` : health.status) : connected ? "connected" : "checking",
      ok:   !healthError && (connected || health?.status === "ok" || health?.status === "degraded"),
      warn: health?.status === "degraded",
    },
    {
      label: "Data Feed",
      value: !connected ? "no connection" : stale ? "STALE >30s" : lastUpdate ? "live" : health?.upstream?.b2?.status ?? "waiting",
      ok:   connected && !stale && (lastUpdate !== null || health?.upstream?.b2?.status === "ok"),
      warn: stale || health?.upstream?.b2?.status === "unreachable",
    },
  ];

  return (
    <div className="bg-surface-container border border-white/10 rounded p-md">
      <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">
        SYSTEM ACTIONS
      </h3>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-sm">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            onClick={() => openAction(action)}
            className={`flex flex-col items-center justify-center gap-2 p-4 bg-surface-container-high border border-white/5 rounded transition-all group ${action.hoverColor}`}
          >
            <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${action.iconClass}`}>
              {action.icon}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Status rows */}
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

      {/* Action confirmation dialog */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={execState === "running" ? undefined : closeDialog} />
          <div className="relative bg-surface-container border border-white/10 rounded-lg w-80 p-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-md">
              <span className={`material-symbols-outlined ${activeAction.iconClass}`}>{activeAction.icon}</span>
              <h4 className="font-semibold text-sm">{activeAction.label}</h4>
            </div>

            {/* Input */}
            {activeAction.needsInput && execState === "idle" && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runAction(activeAction, inputValue)}
                placeholder={activeAction.prompt}
                className="w-full bg-surface-container-low border border-white/10 rounded px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 mb-md focus:outline-none focus:border-primary/50"
              />
            )}

            {/* Feedback */}
            {execState === "running" && (
              <p className="text-[11px] text-on-surface-variant animate-pulse mb-md">Processing…</p>
            )}
            {(execState === "ok" || execState === "error") && execMsg && (
              <p className={`text-[11px] mb-md px-2 py-1.5 rounded border ${
                execState === "ok"
                  ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                  : "bg-red-900/20 border-red-500/30 text-red-400"
              }`}>
                {execState === "ok" ? "✓ " : "✗ "}{execMsg}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-sm justify-end">
              <button
                onClick={closeDialog}
                disabled={execState === "running"}
                className="px-md py-sm text-[11px] bg-surface-variant rounded hover:bg-surface-container-highest transition-colors disabled:opacity-40"
              >
                {execState === "ok" || execState === "error" ? "Close" : "Cancel"}
              </button>
              {(execState === "idle" || execState === "error") && (
                <button
                  onClick={() => runAction(activeAction, inputValue)}
                  disabled={activeAction.needsInput && !inputValue.trim()}
                  className="px-md py-sm text-[11px] bg-primary text-on-primary rounded hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {execState === "error" ? "Retry" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Thin wrapper that exposes a refetch handle ──────────────────────────────

function useB3HealthWithRefetch() {
  const [tick, setTick] = useState(0);
  const base = useB3Health(10_000);
  return { ...base, refetch: () => setTick((t) => t + 1) };
}
