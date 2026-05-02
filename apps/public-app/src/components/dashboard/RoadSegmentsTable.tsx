// TODO: Replace roadSegments dummy data with:
// Socket.IO event: socket.on('congestion:update', (data) => setSegments(data))
// Real-time from B2 Flink → Kafka → Socket.IO relay

import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { ROAD_SEGMENTS } from "@/lib/dummy-data";

function speedColor(kmh: number): string {
  if (kmh <= 25) return "#EF4444";
  if (kmh <= 45) return "#D16900";
  return "#22C55E";
}

export function RoadSegmentsTable() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#1A1D27", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2
          className="text-[17px] font-semibold text-white"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Road Segment Status
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#757780" }}>
          Real-time congestion per corridor
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "var(--font-inter)" }}>
          <thead>
            <tr
              className="text-left text-[11px] uppercase tracking-widest"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#757780" }}
            >
              <th className="px-5 py-3 font-semibold">Road Segment</th>
              <th className="px-5 py-3 font-semibold">Avg Speed</th>
              <th className="px-5 py-3 font-semibold w-48">Congestion</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Incidents</th>
            </tr>
          </thead>
          <tbody>
            {ROAD_SEGMENTS.map((seg, i) => (
              <tr
                key={seg.id}
                className="transition-colors hover:bg-white/2"
                style={{
                  borderBottom:
                    i < ROAD_SEGMENTS.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <td className="px-5 py-4 font-medium text-white">{seg.name}</td>
                <td
                  className="px-5 py-4 font-semibold tabular-nums"
                  style={{ color: speedColor(seg.avgSpeedKmh) }}
                >
                  {seg.avgSpeedKmh} km/h
                </td>
                <td className="px-5 py-4">
                  <ProgressBar value={seg.congestionPct} showLabel />
                </td>
                <td className="px-5 py-4">
                  <Badge variant={seg.level} />
                </td>
                <td className="px-5 py-4 tabular-nums">
                  {seg.incidents > 0 ? (
                    <span style={{ color: "#D16900" }} className="font-semibold">
                      {seg.incidents}
                    </span>
                  ) : (
                    <span style={{ color: "#757780" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {ROAD_SEGMENTS.map((seg) => (
          <div key={seg.id} className="px-4 py-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <span className="text-sm font-medium text-white leading-snug">{seg.name}</span>
              <div className="self-start">
                <Badge variant={seg.level} />
              </div>
            </div>
            <ProgressBar value={seg.congestionPct} showLabel />
            <div className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ color: "#757780" }}>
              <span>
                Avg speed:{" "}
                <span className="font-semibold" style={{ color: speedColor(seg.avgSpeedKmh) }}>
                  {seg.avgSpeedKmh} km/h
                </span>
              </span>
              {seg.incidents > 0 && (
                <span style={{ color: "#D16900" }}>{seg.incidents} incident{seg.incidents > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
