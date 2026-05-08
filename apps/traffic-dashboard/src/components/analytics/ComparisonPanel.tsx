import type { AnalyticsComparison, AnalyticsMetrics } from "@/lib/b3-backend";

function change(current?: AnalyticsMetrics, previous?: AnalyticsMetrics) {
  if (!current || !previous || previous.avg_congestion_score === 0) return null;
  return ((current.avg_congestion_score - previous.avg_congestion_score) / previous.avg_congestion_score) * 100;
}

interface ComparisonPanelProps {
  comparison?: AnalyticsComparison | null;
}

export default function ComparisonPanel({ comparison }: ComparisonPanelProps) {
  const congestionChange = change(comparison?.range_a, comparison?.range_b);
  const incidentA = comparison?.range_a.incident_pie.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const incidentB = comparison?.range_b.incident_pie.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const incidentChange = incidentB === 0 ? null : ((incidentA - incidentB) / incidentB) * 100;
  const spike = comparison?.range_a.top_segments[0];

  return (
    <div className="bg-surface-container border border-white/10 p-lg rounded-xl">
      <div className="flex justify-between items-center mb-md">
        <h4 className="font-title-sm text-on-surface font-semibold text-[18px]">Comparison View</h4>
        <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out">
          <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out" />
        </div>
      </div>

      <div className="space-y-sm">
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Vs. Prior Range</span>
          <span className={`${(congestionChange ?? 0) >= 0 ? "text-error" : "text-secondary"} font-mono-data`}>
            {congestionChange === null ? "—" : `${congestionChange >= 0 ? "+" : ""}${congestionChange.toFixed(1)}%`}
          </span>
        </div>
        <div className="flex justify-between text-body-sm">
          <span className="text-on-surface-variant">Incident Volume</span>
          <span className={`${(incidentChange ?? 0) >= 0 ? "text-error" : "text-secondary"} font-mono-data`}>
            {incidentChange === null ? "—" : `${incidentChange >= 0 ? "+" : ""}${incidentChange.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="mt-lg pt-lg border-t border-white/5">
        <p className="text-[11px] text-on-surface-variant mb-sm uppercase tracking-[0.08em] font-bold">
          AI ANOMALY DETECTION
        </p>
        <div className="flex items-center gap-sm bg-error-container/20 p-sm rounded border border-error/20">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="text-[11px] text-error font-medium leading-tight">
            {spike
              ? `${spike.camera_id} is the highest congestion segment in this range.`
              : "No historical anomaly detected for the selected range."}
          </p>
        </div>
      </div>
    </div>
  );
}
