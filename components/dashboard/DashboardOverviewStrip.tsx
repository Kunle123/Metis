import type { DashboardSnapshot } from "@/lib/dashboard/getDashboardSnapshot";
import { Badge } from "@/components/ui/badge";

/**
 * Single honest line — avoids duplicating the numeric strip in MetisShell.
 */
export function DashboardOverviewStrip({
  aggregates,
  attentionCount,
  attentionBreakdown,
  criticalOpenGaps,
  totalOpenQuestionSlots,
  totalStoredExportPackages,
}: {
  aggregates: DashboardSnapshot["aggregates"];
  attentionCount: number;
  attentionBreakdown: { noSources: number; staleBrief: number; criticalOpenQuestions: number };
  criticalOpenGaps: number;
  totalOpenQuestionSlots: number;
  totalStoredExportPackages: number;
}) {
  if (aggregates.totalIssues === 0) return null;

  return (
    <section aria-label="Dashboard overview" className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
          {aggregates.totalIssues} issues
        </Badge>
        <Badge className="border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_52%,transparent)] text-[--metis-status-warning-fg]">
          {attentionCount} may need attention
        </Badge>
        <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_48%,transparent)] text-[--metis-text-tertiary]">
          {totalOpenQuestionSlots} open question slots
        </Badge>
        <Badge className="border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_46%,transparent)] text-[--metis-status-danger-fg]">
          {criticalOpenGaps} critical open questions
        </Badge>
        <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_48%,transparent)] text-[--metis-text-tertiary]">
          {aggregates.issuesNeedingBriefRegeneration} Full/Executive brief(s) may need regenerate
        </Badge>
        <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_48%,transparent)] text-[--metis-text-tertiary]">
          {totalStoredExportPackages} saved exports
        </Badge>
      </div>

      <p className="mt-2 text-[0.72rem] leading-relaxed text-[--metis-paper-muted]">
        Sorted by recent activity (not urgency). Attention chips highlight simple heuristics:{" "}
        <span className="text-[--metis-paper]">{attentionBreakdown.noSources}</span> with no sources,{" "}
        <span className="text-[--metis-paper]">{attentionBreakdown.staleBrief}</span> with a stale Full or Executive brief,{" "}
        <span className="text-[--metis-paper]">{attentionBreakdown.criticalOpenQuestions}</span> with critical/high-priority open questions. Templates on the right are illustrative — not live monitoring.
      </p>
    </section>
  );
}
