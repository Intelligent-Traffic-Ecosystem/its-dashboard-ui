"use client";

import { useState, useCallback, useEffect } from "react";
import { getThresholds, updateThresholds } from "@/lib/backend";

export default function AlertConfigPage() {
  const [warningLevel, setWarningLevel] = useState("30");
  const [warningDuration, setWarningDuration] = useState("10");
  const [criticalLevel, setCriticalLevel] = useState("55");
  const [criticalDuration, setCriticalDuration] = useState("5");
  const [emergencyLevel, setEmergencyLevel] = useState("80");
  const [emergencyDuration, setEmergencyDuration] = useState("2");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getThresholds()
      .then((t) => {
        setWarningLevel(String(Math.round(t.congestion_threshold_low * 100)));
        setCriticalLevel(String(Math.round(t.congestion_threshold_moderate * 100)));
        setEmergencyLevel(String(Math.round(t.congestion_threshold_high * 100)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};
    const w = Number(warningLevel);
    const c = Number(criticalLevel);
    const e = Number(emergencyLevel);
    const wd = Number(warningDuration);
    const cd = Number(criticalDuration);
    const ed = Number(emergencyDuration);

    if (!warningLevel || isNaN(w) || w <= 0) errors.warningLevel = "Must be a positive number.";
    if (!criticalLevel || isNaN(c) || c <= 0) errors.criticalLevel = "Must be a positive number.";
    if (!emergencyLevel || isNaN(e) || e <= 0) errors.emergencyLevel = "Must be a positive number.";
    if (!warningDuration || isNaN(wd) || wd <= 0) errors.warningDuration = "Must be a positive number.";
    if (!criticalDuration || isNaN(cd) || cd <= 0) errors.criticalDuration = "Must be a positive number.";
    if (!emergencyDuration || isNaN(ed) || ed <= 0) errors.emergencyDuration = "Must be a positive number.";

    if (!errors.warningLevel && !errors.criticalLevel && w >= c)
      errors.criticalLevel = "Critical must be greater than Warning.";
    if (!errors.criticalLevel && !errors.emergencyLevel && c >= e)
      errors.emergencyLevel = "Emergency must be greater than Critical.";
    if (!errors.warningLevel && !errors.emergencyLevel && w >= e)
      errors.emergencyLevel = "Emergency must be greater than Warning.";

    return errors;
  }, [warningLevel, criticalLevel, emergencyLevel, warningDuration, criticalDuration, emergencyDuration]);

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await updateThresholds({
        congestion_threshold_low: Number(warningLevel) / 100,
        congestion_threshold_moderate: Number(criticalLevel) / 100,
        congestion_threshold_high: Number(emergencyLevel) / 100,
      });
      setToast({ type: "success", message: "Threshold configuration saved successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to save thresholds. Check backend connection." });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDiscard = () => {
    setLoading(true);
    getThresholds()
      .then((t) => {
        setWarningLevel(String(Math.round(t.congestion_threshold_low * 100)));
        setCriticalLevel(String(Math.round(t.congestion_threshold_moderate * 100)));
        setEmergencyLevel(String(Math.round(t.congestion_threshold_high * 100)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <>
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-[fadeIn_0.3s_ease-in-out] ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-error text-on-error shadow-error/20"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-title-sm text-sm">{toast.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-display-lg text-display-lg text-on-surface mb-2">Alert Configuration</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Define the congestion thresholds that trigger automated system alerts. Values are stored on
          the backend and apply to all active monitoring zones.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-on-surface-variant font-body-sm text-body-sm py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading current thresholds…
        </div>
      ) : (
        <form className="max-w-4xl space-y-6" onSubmit={handleSave}>
          {/* Warning Threshold */}
          <div className="bg-surface-container rounded-xl border border-white/10 p-6 transition-all hover:border-outline-variant">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-secondary-fixed-dim"></span>
                  <h4 className="font-title-sm text-title-sm text-on-surface">Warning Threshold</h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Triggers initial monitoring escalation and logs an event. No automated external
                  actions are taken.
                </p>
              </div>
              <div className="w-full md:w-64 space-y-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    CONGESTION LEVEL (%)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    min="1"
                    max="99"
                    value={warningLevel}
                    onChange={(e) => setWarningLevel(e.target.value)}
                  />
                  {errors.warningLevel && (
                    <p className="text-error text-xs mt-1">{errors.warningLevel}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    SUSTAINED DURATION (MIN)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    min="1"
                    value={warningDuration}
                    onChange={(e) => setWarningDuration(e.target.value)}
                  />
                  {errors.warningDuration && (
                    <p className="text-error text-xs mt-1">{errors.warningDuration}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Threshold */}
          <div className="bg-surface-container rounded-xl border border-white/10 p-6 transition-all hover:border-outline-variant">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary-container"></span>
                  <h4 className="font-title-sm text-title-sm text-on-surface">Critical Threshold</h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Triggers automated traffic rerouting suggestions and notifies active operators on
                  duty.
                </p>
              </div>
              <div className="w-full md:w-64 space-y-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    CONGESTION LEVEL (%)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    min="1"
                    max="99"
                    value={criticalLevel}
                    onChange={(e) => setCriticalLevel(e.target.value)}
                  />
                  {errors.criticalLevel && (
                    <p className="text-error text-xs mt-1">{errors.criticalLevel}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    SUSTAINED DURATION (MIN)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    min="1"
                    value={criticalDuration}
                    onChange={(e) => setCriticalDuration(e.target.value)}
                  />
                  {errors.criticalDuration && (
                    <p className="text-error text-xs mt-1">{errors.criticalDuration}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Threshold */}
          <div className="bg-surface-container rounded-xl border border-white/10 p-6 transition-all hover:border-outline-variant relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full bg-error"></span>
                  <h4 className="font-title-sm text-title-sm text-on-surface">Emergency Threshold</h4>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Initiates immediate system-wide lockdown protocols, broadcasts to local authorities,
                  and engages digital signage overrides.
                </p>
              </div>
              <div className="w-full md:w-64 space-y-4">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    CONGESTION LEVEL (%)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-error/50 rounded-lg py-2 px-3 text-error font-mono-data text-mono-data focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                    type="number"
                    min="1"
                    max="100"
                    value={emergencyLevel}
                    onChange={(e) => setEmergencyLevel(e.target.value)}
                  />
                  {errors.emergencyLevel && (
                    <p className="text-error text-xs mt-1">{errors.emergencyLevel}</p>
                  )}
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    SUSTAINED DURATION (MIN)
                  </label>
                  <input
                    className="w-full bg-surface-container-highest border border-error/50 rounded-lg py-2 px-3 text-error font-mono-data text-mono-data focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                    type="number"
                    min="1"
                    value={emergencyDuration}
                    onChange={(e) => setEmergencyDuration(e.target.value)}
                  />
                  {errors.emergencyDuration && (
                    <p className="text-error text-xs mt-1">{errors.emergencyDuration}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
            <button
              className="px-6 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-title-sm text-body-sm"
              type="button"
              onClick={handleDiscard}
              disabled={saving}
            >
              Discard Changes
            </button>
            <button
              className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-title-sm text-body-sm shadow-lg shadow-primary-container/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={!isValid || saving}
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              {saving ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}