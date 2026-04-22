export default function AlertFilters() {
  return (
    <div className="grid grid-cols-12 gap-4 bg-surface-container-low p-4 rounded-xl border border-white/5">
      {/* Search */}
      <div className="col-span-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-sm">
          search
        </span>
        <input
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg pl-10 pr-4 py-2 text-body-md text-on-surface placeholder:text-slate-600 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          placeholder="Search Alerts (ID, Type, Location...)"
          type="text"
        />
      </div>

      {/* Severity */}
      <div className="col-span-2">
        <select className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none">
          <option>Severity: All</option>
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
          <option>Low</option>
        </select>
      </div>

      {/* Road segment */}
      <div className="col-span-3">
        <select className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none">
          <option>Road Segment: I-95 North</option>
          <option>I-95 South</option>
          <option>Hwy 401</option>
          <option>Expressway Loop</option>
        </select>
      </div>

      {/* Date */}
      <div className="col-span-3">
        <input
          className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-2 text-body-md text-on-surface focus:ring-1 focus:ring-primary outline-none"
          type="date"
        />
      </div>
    </div>
  );
}
