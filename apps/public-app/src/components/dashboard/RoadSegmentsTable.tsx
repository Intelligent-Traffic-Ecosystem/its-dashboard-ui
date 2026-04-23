import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ROAD_SEGMENTS } from "@/lib/dummy-data";

export function RoadSegmentsTable() {
  return (
    <div className="rounded-xl bg-zinc-900 ring-1 ring-zinc-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-white">Road Segments</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Real-time congestion per corridor
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 text-xs border-b border-zinc-800">
              <th className="px-5 py-3 font-medium">Segment</th>
              <th className="px-5 py-3 font-medium">Congestion</th>
              <th className="px-5 py-3 font-medium w-40">Level</th>
              <th className="px-5 py-3 font-medium">Avg Speed</th>
              <th className="px-5 py-3 font-medium">Incidents</th>
            </tr>
          </thead>
          <tbody>
            {ROAD_SEGMENTS.map((seg, i) => (
              <tr
                key={seg.id}
                className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                  i === ROAD_SEGMENTS.length - 1 ? "border-b-0" : ""
                }`}
              >
                <td className="px-5 py-3.5 text-white font-medium">
                  {seg.name}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <ProgressBar
                      value={seg.congestionPct}
                      showLabel
                      className="flex-1"
                    />
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={seg.level} />
                </td>
                <td className="px-5 py-3.5 text-zinc-300 tabular-nums">
                  {seg.avgSpeedKmh} km/h
                </td>
                <td className="px-5 py-3.5 tabular-nums">
                  {seg.incidents > 0 ? (
                    <span className="text-orange-400 font-medium">
                      {seg.incidents}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
