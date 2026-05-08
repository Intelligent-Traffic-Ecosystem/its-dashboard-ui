"use client";

import { useEffect, useState } from "react";
import { getZones, createZone, deleteZone, type Zone } from "@/lib/backend";

type CoordRow = { lat: string; lon: string };

function emptyCoord(): CoordRow {
  return { lat: "", lon: "" };
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<CoordRow[]>([emptyCoord(), emptyCoord(), emptyCoord()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      setZones(await getZones());
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCoords([emptyCoord(), emptyCoord(), emptyCoord()]);
    setFormError(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const parsed = coords.map((c, i) => {
      const lat = parseFloat(c.lat);
      const lon = parseFloat(c.lon);
      if (isNaN(lat) || isNaN(lon))
        throw Object.assign(new Error(`Invalid coordinate at row ${i + 1}.`), { user: true });
      return { lat, lon };
    });

    if (parsed.length < 3) {
      setFormError("At least 3 coordinate points are required.");
      return;
    }

    setSaving(true);
    try {
      await createZone({ name, description, coordinates: parsed });
      resetForm();
      await load();
      showToast("success", `Zone "${name}" created.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create zone.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteZone(deleteTarget.id);
      if (!res.ok) throw new Error("Delete failed.");
      setZones((z) => z.filter((x) => x.id !== deleteTarget.id));
      showToast("success", `Zone "${deleteTarget.name}" deleted.`);
    } catch {
      showToast("error", "Failed to delete zone.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const updateCoord = (i: number, field: "lat" | "lon", value: string) => {
    setCoords((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-error text-on-error"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-title-sm text-sm">{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Delete Zone</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Delete <span className="text-on-surface font-semibold">{deleteTarget.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-title-sm text-body-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 transition-colors font-title-sm text-body-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-1">Zone Management</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Create and manage geographic monitoring zones using polygon coordinates.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-caps text-label-caps"
        >
          <span className="material-symbols-outlined text-[18px]">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "New Zone"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-surface-container border border-white/10 rounded-xl p-6">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-6">New Monitoring Zone</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  ZONE NAME *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. City Center North"
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                  DESCRIPTION
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-label-caps text-label-caps text-on-surface-variant">
                  POLYGON COORDINATES * (min 3 points)
                </label>
                <button
                  type="button"
                  onClick={() => setCoords((c) => [...c, emptyCoord()])}
                  className="text-primary hover:text-primary-fixed font-label-caps text-label-caps flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Point
                </button>
              </div>
              <div className="space-y-2">
                {coords.map((c, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <span className="font-mono-data text-mono-data text-on-surface-variant text-xs w-5 text-right flex-shrink-0">
                      {i + 1}
                    </span>
                    <input
                      value={c.lat}
                      onChange={(e) => updateCoord(i, "lat", e.target.value)}
                      placeholder="Latitude (e.g. 6.0248)"
                      className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-mono-data text-mono-data text-sm focus:outline-none focus:border-primary"
                    />
                    <input
                      value={c.lon}
                      onChange={(e) => updateCoord(i, "lon", e.target.value)}
                      placeholder="Longitude (e.g. 80.2172)"
                      className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface font-mono-data text-mono-data text-sm focus:outline-none focus:border-primary"
                    />
                    {coords.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setCoords((c) => c.filter((_, idx) => idx !== i))}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <p className="text-error font-body-sm text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-white/5 transition-colors font-label-caps text-label-caps"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-caps text-label-caps disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">add_location</span>
                )}
                {saving ? "Creating…" : "Create Zone"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zones Table */}
      <div className="bg-surface-container border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-body-sm text-body-sm">
            Loading zones…
          </div>
        ) : zones.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-3 block">layers</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              No monitoring zones defined yet.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary font-label-caps text-label-caps hover:underline"
            >
              Create your first zone
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-white/10">
                {["ID", "Name", "Description", "Points", "Created", "Actions"].map((h) => (
                  <th key={h} className="p-4 font-label-caps text-label-caps text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    #{zone.id}
                  </td>
                  <td className="p-4 font-title-sm text-title-sm text-on-surface">{zone.name}</td>
                  <td className="p-4 font-body-sm text-body-sm text-on-surface-variant max-w-xs truncate">
                    {zone.description || "—"}
                  </td>
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    {zone.coordinates.length}
                  </td>
                  <td className="p-4 font-mono-data text-mono-data text-on-surface-variant">
                    {new Date(zone.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setDeleteTarget(zone)}
                      className="px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:border-error hover:text-error hover:bg-error/10 transition-colors font-label-caps text-label-caps"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}