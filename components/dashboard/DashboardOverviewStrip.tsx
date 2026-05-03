import type { DashboardSnapshot } from "@/lib/dashboard/getDashboardSnapshot";

/**
 * Single honest line — avoids duplicating the numeric strip in MetisShell.
 */
export function DashboardOverviewStrip({ aggregates }: { aggregates: DashboardSnapshot["aggregates"] }) {
  if (aggregates.totalIssues === 0) return null;

  return (
    <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-3 sm:px-6">
      <p className="text-[0.72rem] leading-relaxed text-[--metis-paper-muted]">
        Counts above reflect your Metis database at page load — illustrative templates on the right are not live monitoring.
      </p>
    </div>
  );
}
