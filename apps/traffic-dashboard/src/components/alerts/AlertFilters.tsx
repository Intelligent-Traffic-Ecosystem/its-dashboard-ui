"use client";

export interface AlertFilterState {
  search: string;
  severity: string;
  cameraId: string;
  date: string;
}

interface AlertFiltersProps {
  filters: AlertFilterState;
  cameras: string[];
  onChange: (filters: AlertFilterState) => void;
}

export default function AlertFilters({ filters, cameras, onChange }: AlertFiltersProps) {
  const update = (patch: Partial<AlertFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-12 gap-4 bg-surface-container-low p-4 rounded-xl border border-white/5">
      <div className="col-span-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-sm">
          search
        </span>
        <input
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg pl-10 pr-4 py-2 text-body-md text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          placeholder="Search Alerts (ID, Type, Location...)"
          type="text"
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
        />
      </div>

      <div className="col-span-2">
        <select
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
          value={filters.severity}
          onChange={(event) => update({ severity: event.target.value })}
        >
          <option value="">Severity: All</option>
          <option value="emergency">Emergency</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="informational">Informational</option>
        </select>
      </div>

      <div className="col-span-3">
        <select
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
          value={filters.cameraId}
          onChange={(event) => update({ cameraId: event.target.value })}
        >
          <option value="">Camera: All</option>
          {cameras.map((cameraId) => (
            <option key={cameraId} value={cameraId}>{cameraId}</option>
          ))}
        </select>
      </div>

      <div className="col-span-3">
        <input
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
          type="date"
          value={filters.date}
          onChange={(event) => update({ date: event.target.value })}
        />
      </div>
    </div>
  );
}
