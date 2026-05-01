"use client";

import { useState, useCallback } from "react";

export default function AlertConfigPage() {
  const [warningLevel, setWarningLevel] = useState("65");
  const [warningDuration, setWarningDuration] = useState("10");
  const [criticalLevel, setCriticalLevel] = useState("85");
  const [criticalDuration, setCriticalDuration] = useState("5");
  const [emergencyLevel, setEmergencyLevel] = useState("95");
  const [emergencyDuration, setEmergencyDuration] = useState("2");
  const [toast, setToast] = useState(false);

  const validate = useCallback(() => {
    const errors: Record<string, string> = {};

    const w = Number(warningLevel);
    const c = Number(criticalLevel);
    const e = Number(emergencyLevel);
    const wd = Number(warningDuration);
    const cd = Number(criticalDuration);
    const ed = Number(emergencyDuration);

    // Warning validation
    if (!warningLevel || isNaN(w)) {
      errors.warningLevel = "Must be a valid number.";
    } else if (w <= 0) {
      errors.warningLevel = "Must be a positive number.";
    }

    // Critical validation
    if (!criticalLevel || isNaN(c)) {
      errors.criticalLevel = "Must be a valid number.";
    } else if (c <= 0) {
      errors.criticalLevel = "Must be a positive number.";
    }

    // Emergency validation
    if (!emergencyLevel || isNaN(e)) {
      errors.emergencyLevel = "Must be a valid number.";
    } else if (e <= 0) {
      errors.emergencyLevel = "Must be a positive number.";
    }

    // Duration validations
    if (!warningDuration || isNaN(wd) || wd <= 0) {
      errors.warningDuration = "Must be a positive number.";
    }
    if (!criticalDuration || isNaN(cd) || cd <= 0) {
      errors.criticalDuration = "Must be a positive number.";
    }
    if (!emergencyDuration || isNaN(ed) || ed <= 0) {
      errors.emergencyDuration = "Must be a positive number.";
    }

    // Cross-field: Warning < Critical < Emergency
    if (!errors.warningLevel && !errors.criticalLevel && w >= c) {
      errors.criticalLevel = "Critical must be greater than Warning.";
    }
    if (!errors.criticalLevel && !errors.emergencyLevel && c >= e) {
      errors.emergencyLevel = "Emergency must be greater than Critical.";
    }
    if (!errors.warningLevel && !errors.emergencyLevel && w >= e) {
      errors.emergencyLevel = "Emergency must be greater than Warning.";
    }

    return errors;
  }, [warningLevel, criticalLevel, emergencyLevel, warningDuration, criticalDuration, emergencyDuration]);

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-[fadeIn_0.3s_ease-in-out]">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="font-title-sm text-sm">Threshold configuration saved successfully.</span>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <h2 className="font-display-lg text-display-lg text-on-surface mb-2">Alert Configuration</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
          Define the specific parameters that trigger automated system alerts. Changes to these
          thresholds affect all active monitoring zones unless specifically overridden at the zone
          level.
        </p>
      </div>

      {/* Configuration Form */}
      <form className="max-w-4xl space-y-6" onSubmit={handleSave}>
        {/* Warning Threshold Card */}
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
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    value={warningLevel}
                    onChange={(e) => setWarningLevel(e.target.value)}
                  />
                </div>
                {errors.warningLevel && (
                  <p className="text-red-500 text-xs mt-1">{errors.warningLevel}</p>
                )}
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  SUSTAINED DURATION (MIN)
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    value={warningDuration}
                    onChange={(e) => setWarningDuration(e.target.value)}
                  />
                </div>
                {errors.warningDuration && (
                  <p className="text-red-500 text-xs mt-1">{errors.warningDuration}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Critical Threshold Card */}
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
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    value={criticalLevel}
                    onChange={(e) => setCriticalLevel(e.target.value)}
                  />
                </div>
                {errors.criticalLevel && (
                  <p className="text-red-500 text-xs mt-1">{errors.criticalLevel}</p>
                )}
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  SUSTAINED DURATION (MIN)
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-2 px-3 text-on-surface font-mono-data text-mono-data focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="number"
                    value={criticalDuration}
                    onChange={(e) => setCriticalDuration(e.target.value)}
                  />
                </div>
                {errors.criticalDuration && (
                  <p className="text-red-500 text-xs mt-1">{errors.criticalDuration}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Threshold Card */}
        <div className="bg-surface-container rounded-xl border border-white/10 p-6 transition-all hover:border-outline-variant relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-error"></span>
                <h4 className="font-title-sm text-title-sm text-on-surface">
                  Emergency Threshold
                </h4>
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
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-error/50 rounded-lg py-2 px-3 text-error font-mono-data text-mono-data focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                    type="number"
                    value={emergencyLevel}
                    onChange={(e) => setEmergencyLevel(e.target.value)}
                  />
                </div>
                {errors.emergencyLevel && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyLevel}</p>
                )}
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  SUSTAINED DURATION (MIN)
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-highest border border-error/50 rounded-lg py-2 px-3 text-error font-mono-data text-mono-data focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                    type="number"
                    value={emergencyDuration}
                    onChange={(e) => setEmergencyDuration(e.target.value)}
                  />
                </div>
                {errors.emergencyDuration && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyDuration}</p>
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
          >
            Discard Changes
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-title-sm text-body-sm shadow-lg shadow-primary-container/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={!isValid}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Configuration
          </button>
        </div>
      </form>
    </>
  );
}
