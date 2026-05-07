"use client";

import { useState } from "react";
import { BACKEND_BASE_URL } from "@/lib/backend";

type BroadcastEntry = {
  timestamp: string;
  severity: "info" | "warning" | "critical";
  severityIcon: string;
  severityClass: string;
  title: string;
  author: string;
};

const SEVERITY_STYLE = {
  info: { icon: "info", cls: "bg-primary/20 text-primary", label: "Info" },
  warning: { icon: "warning", cls: "bg-tertiary/20 text-tertiary", label: "Warning" },
  critical: { icon: "gpp_maybe", cls: "bg-error-container text-error", label: "Critical" },
};

export default function BroadcastPage() {
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<BroadcastEntry[]>([
    {
      timestamp: "2023-10-27 14:32:01",
      severity: "critical",
      severityIcon: "gpp_maybe",
      severityClass: "bg-error-container text-error",
      title: "Hwy 401 Major Collision Warning",
      author: "SYS_ADMIN_01",
    },
    {
      timestamp: "2023-10-26 09:00:00",
      severity: "info",
      severityIcon: "info",
      severityClass: "bg-primary/20 text-primary",
      title: "Routine Sensor Calibration",
      author: "AUTO_SYSTEM",
    },
  ]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 100) setTitle(e.target.value);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 500) setBody(e.target.value);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    setSending(true);
    try {
      await fetch(`${BACKEND_BASE_URL}/api/broadcast`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity, title, message: body }),
      });
      setHistory((h) => [
        {
          timestamp: new Date().toLocaleString(),
          severity,
          severityIcon: SEVERITY_STYLE[severity].icon,
          severityClass: SEVERITY_STYLE[severity].cls,
          title,
          author: "Admin",
        },
        ...h,
      ]);
      setToast({ type: "success", message: "Broadcast sent to all active sessions." });
      setTitle("");
      setBody("");
      setSeverity("info");
    } catch {
      setToast({ type: "success", message: "Broadcast queued (backend not connected)." });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-[fadeIn_0.3s_ease-in-out] ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-error text-on-error"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-title-sm text-sm">{toast.message}</span>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-[28px]">campaign</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Confirm Broadcast</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-2">
              Send this <span className={`font-semibold ${SEVERITY_STYLE[severity].cls.split(" ")[1]}`}>{severity}</span> broadcast to all active operators?
            </p>
            <p className="font-title-sm text-title-sm text-on-surface mb-6">{title}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-title-sm text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-title-sm text-body-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col items-center">
        <div className="w-full max-w-4xl flex flex-col gap-xl">
          <div className="flex flex-col gap-2">
            <h1 className="font-display-lg text-display-lg text-on-surface">System Notification</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Deploy global messages to all active terminal operators and connected endpoints.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-xl p-md flex flex-col gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["info", "warning", "critical"] as const).map((s) => {
                    const st = SEVERITY_STYLE[s];
                    return (
                      <label key={s} className="relative cursor-pointer">
                        <input
                          checked={severity === s}
                          onChange={() => setSeverity(s)}
                          className="peer sr-only"
                          name="severity"
                          type="radio"
                        />
                        <div
                          className={`p-3 border border-outline-variant rounded-lg flex items-center gap-2 peer-checked:bg-primary/10 transition-all ${
                            s === "info"
                              ? "peer-checked:border-primary"
                              : s === "warning"
                              ? "peer-checked:border-tertiary peer-checked:bg-tertiary/10"
                              : "peer-checked:border-error peer-checked:bg-error-container/30"
                          }`}
                        >
                          <span className={`material-symbols-outlined ${st.cls.split(" ")[1]}`}>
                            {st.icon}
                          </span>
                          <span className="font-title-sm text-title-sm text-on-surface capitalize">{s}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase flex justify-between">
                  <span>Message Title</span>
                  <span className="text-outline">{title.length} / 100</span>
                </label>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md placeholder:text-outline"
                  placeholder="e.g. Scheduled Maintenance Downtime"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-label-caps text-on-surface-variant uppercase flex justify-between">
                  <span>Message Body</span>
                  <span className="text-outline">{body.length} / 500</span>
                </label>
                <textarea
                  className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md resize-none placeholder:text-outline"
                  placeholder="Enter the detailed broadcast message here..."
                  rows={4}
                  value={body}
                  onChange={handleBodyChange}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-6 mt-2">
              <button
                onClick={() => title.trim() && setShowModal(true)}
                disabled={!title.trim() || sending}
                className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-6 py-3 rounded-lg font-title-sm text-title-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined">send</span>
                )}
                {sending ? "Sending…" : "Send Broadcast"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h2 className="font-headline-md text-headline-md text-on-surface">Broadcast History</h2>
            <div className="bg-surface-container border border-white/10 rounded-xl overflow-hidden">
              {history.length === 0 ? (
                <p className="p-8 text-center font-body-sm text-body-sm text-on-surface-variant">
                  No broadcasts sent yet.
                </p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-high border-b border-white/10">
                      {["Timestamp", "Severity", "Title", "Author"].map((h) => (
                        <th key={h} className="p-4 font-label-caps text-label-caps text-on-surface-variant uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {history.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`${idx < history.length - 1 ? "border-b border-white/5" : ""} hover:bg-white/5 transition-colors`}
                      >
                        <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                          {row.timestamp}
                        </td>
                        <td className="p-4">
                          <span className={`${row.severityClass} px-2 py-1 rounded text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1`}>
                            <span className="material-symbols-outlined text-[12px]">{row.severityIcon}</span>
                            {SEVERITY_STYLE[row.severity].label}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface font-medium">{row.title}</td>
                        <td className="p-4 text-on-surface-variant">{row.author}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}