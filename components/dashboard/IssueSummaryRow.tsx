import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DashboardIssueVM } from "@/lib/dashboard/getDashboardSnapshot";
import { Badge } from "@/components/ui/badge";

import { IssueMetaStrip } from "./IssueMetaStrip";
import { IssueStatTile } from "./IssueStatTile";

/** @deprecated Prefer `DashboardIssueVM` from `@/lib/dashboard/getDashboardSnapshot`. */
export type DashboardIssue = DashboardIssueVM;

/** Compact secondary actions — at most one `emphasize` for stale brief refresh only. */
function rowActionClass(emphasize?: boolean) {
  if (emphasize) {
    return "rounded-md px-1 py-0.5 text-[0.72rem] font-medium text-[--metis-brass-soft] underline-offset-4 transition hover:text-[--metis-brass] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(0,0,0,0.35)]";
  }
  return "rounded-md px-1 py-0.5 text-[0.72rem] text-[--metis-paper-muted] underline-offset-4 transition hover:text-[--metis-paper] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(0,0,0,0.35)]";
}

/** Metric tiles stay neutral — no brass; subtle grouped hover on the tile. */
const metricTileWrapClass =
  "group/stat block h-full min-w-0 rounded-[1rem] outline-none ring-offset-2 ring-offset-[rgba(0,0,0,0.2)] focus-visible:ring-2 focus-visible:ring-white/25";

function chipClass(tone: "neutral" | "warning") {
  if (tone === "warning") {
    return "inline-flex items-center rounded-full border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_52%,transparent)] px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-warning-fg]";
  }
  return "inline-flex items-center rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-secondary]";
}

export function IssueSummaryRow({ issue }: { issue: DashboardIssueVM }) {
  const base = `/issues/${issue.id}`;
  const priority = issue.priority;
  const showPriority = priority === "Critical" || priority === "High";
  const attention: { href: string; label: string }[] = [];
  if (issue.sourcesCount === 0) attention.push({ href: `${base}/sources`, label: "Add sources" });
  if (issue.fullBriefStale || issue.executiveBriefStale) {
    attention.push({
      href: issue.fullBriefStale ? `${base}/brief?mode=full` : `${base}/brief?mode=executive`,
      label: "Refresh brief",
    });
  }
  const criticalOpenQuestions = issue.openGapsCount > 0 && showPriority;
  if (criticalOpenQuestions) {
    attention.push({ href: `${base}/gaps`, label: "Critical open questions" });
  }

  const staleFull = issue.fullBriefStale;
  const staleExec = issue.executiveBriefStale;
  const emphasizeFullRefresh = staleFull;
  const emphasizeExecRefresh = staleExec && !staleFull;

  const fullBriefLabel = staleFull ? "Refresh full brief" : "Open full brief";
  const execBriefLabel = staleExec ? "Refresh executive brief" : "Open executive brief";

  return (
    <div className="grid min-w-0 items-start gap-4 rounded-[1.45rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_72%,transparent)] p-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)] sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(9rem,0.72fr)_minmax(13.5rem,1fr)] lg:gap-x-6">
      <div className="min-w-0 space-y-3 lg:py-0.5">
        <div className="flex flex-wrap gap-2">
          <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] text-[--metis-text-secondary]">
            {issue.issueType}
          </Badge>
          <Badge className="border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_46%,transparent)] text-[--metis-status-danger-fg]">
            {issue.severity}
          </Badge>
          <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_48%,transparent)] text-[--metis-text-tertiary]">
            {issue.status}
          </Badge>
          {showPriority ? <Badge className="border-0 bg-amber-950/40 text-amber-100">{priority} priority</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Attention</span>
          {attention.length > 0 ? (
            attention.map((item) => (
              <Link key={item.href + item.label} href={item.href} className={chipClass("warning")}>
                {item.label}
              </Link>
            ))
          ) : (
            <span className={chipClass("neutral")}>No immediate flags</span>
          )}
        </div>
        <div>
          <Link href={base} className="group/title block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60">
            <h4 className="text-lg font-medium text-[--metis-paper] group-hover/title:text-white">{issue.title}</h4>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[--metis-paper-muted]">{issue.summary}</p>
            <span className="mt-2 inline-flex items-center gap-2 text-[0.8rem] text-[--metis-paper-muted] transition group-hover/title:text-[--metis-paper]">
              Continue in workspace
              <ArrowRight className="h-4 w-4 opacity-70 group-hover/title:opacity-100" />
            </span>
          </Link>
        </div>
      </div>

      <IssueMetaStrip ownerName={issue.ownerName} audience={issue.audience} updatedAt={issue.updatedAt} />

      <div className="min-w-0 border-t border-[--metis-outline-subtle] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 lg:pb-1">
        <div className="grid min-h-0 min-w-0 grid-cols-2 gap-2 sm:gap-2.5">
          <Link
            href={`${base}/gaps`}
            aria-label={`Open questions (${issue.openGapsCount}), review in workspace`}
            className={metricTileWrapClass}
          >
            <IssueStatTile
              label="Open questions"
              value={issue.openGapsCount}
              className="h-full border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_84%,transparent)] transition-colors group-hover/stat:bg-[color-mix(in_oklab,var(--metis-surface-elevated)_22%,transparent)]"
            />
          </Link>
          <Link
            href={`${base}/sources`}
            aria-label={`Sources (${issue.sourcesCount}), review in workspace`}
            className={metricTileWrapClass}
          >
            <IssueStatTile
              label="Sources"
              value={issue.sourcesCount}
              className="h-full border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_84%,transparent)] transition-colors group-hover/stat:bg-[color-mix(in_oklab,var(--metis-surface-elevated)_22%,transparent)]"
            />
          </Link>
        </div>

        <nav className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-[0.72rem]" aria-label={`Actions for issue ${issue.title}`}>
          <Link href={`${base}/brief?mode=full`} className={rowActionClass(emphasizeFullRefresh)}>
            {fullBriefLabel}
          </Link>
          <span className="px-1 text-[0.6rem] text-[--metis-text-tertiary]" aria-hidden>
            ·
          </span>
          <Link href={`${base}/brief?mode=executive`} className={rowActionClass(emphasizeExecRefresh)}>
            {execBriefLabel}
          </Link>
          <span className="px-1 text-[0.6rem] text-[--metis-text-tertiary]" aria-hidden>
            ·
          </span>
          <Link href={`${base}/messages`} className={rowActionClass(false)}>
            Open messages
            {issue.messageVariantCount > 0 ? ` (${issue.messageVariantCount})` : ""}
          </Link>
          <span className="px-1 text-[0.6rem] text-[--metis-text-tertiary]" aria-hidden>
            ·
          </span>
          <Link href={`${base}/export`} className={rowActionClass(false)}>
            Prepare output
          </Link>
          <span className="px-1 text-[0.6rem] text-[--metis-text-tertiary]" aria-hidden>
            ·
          </span>
          <Link href={`${base}/activity`} className={rowActionClass(false)}>
            Activity timeline
          </Link>
        </nav>
      </div>
    </div>
  );
}
