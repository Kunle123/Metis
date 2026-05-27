import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { DashboardIssueVM } from "@/lib/dashboard/getDashboardSnapshot";

const mobileChipBase =
  "inline-flex max-w-full min-w-0 shrink-0 items-center truncate rounded-full border px-2 py-0.5 text-[0.62rem] font-medium leading-none";

function issueTypeChip() {
  return `${mobileChipBase} border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] text-[--metis-text-secondary]`;
}

function severityChip(severity: string) {
  if (severity === "Critical" || severity === "High") {
    return `${mobileChipBase} border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_46%,transparent)] text-[--metis-status-danger-fg]`;
  }
  if (severity === "Important" || severity === "Moderate") {
    return `${mobileChipBase} border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_46%,transparent)] text-[--metis-status-warning-fg]`;
  }
  return `${mobileChipBase} border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_72%,transparent)] text-[--metis-status-neutral-fg]`;
}

function statusChip(status: string) {
  const looksReady = /\bready\b/i.test(status) && !/\bneeds\b/i.test(status);
  if (looksReady) {
    return `${mobileChipBase} border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_46%,transparent)] text-[--metis-status-success-fg]`;
  }
  return `${mobileChipBase} border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_72%,transparent)] text-[--metis-status-neutral-fg]`;
}

function formatUpdatedShort(updatedAt: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(updatedAt);
}

/** First human-readable attention line for scanning (not exhaustive). */
function attentionSummaryLabel(issue: DashboardIssueVM) {
  const showPriority = issue.priority === "Critical" || issue.priority === "High";
  const criticalOpenQuestions = issue.openGapsCount > 0 && showPriority;
  const parts: string[] = [];
  if (issue.sourcesCount === 0) parts.push("Add sources");
  if (issue.fullBriefStale || issue.executiveBriefStale) parts.push("Brief may need refresh");
  if (criticalOpenQuestions) parts.push("Critical open questions");
  if (parts.length === 0) return "No urgent flags";
  return parts.slice(0, 2).join(" · ");
}

export function DashboardMobileIssueCard({ issue }: { issue: DashboardIssueVM }) {
  const base = `/issues/${issue.id}`;
  const staleFull = issue.fullBriefStale;
  const staleExec = issue.executiveBriefStale;
  const emphasizeFullRefresh = staleFull;
  const emphasizeExecRefresh = staleExec && !staleFull;
  const fullBriefLabel = staleFull ? "Refresh full brief" : "Full brief";
  const execBriefLabel = staleExec ? "Refresh executive brief" : "Executive brief";

  return (
    <article className="rounded-xl border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_78%,transparent)] p-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_8%,transparent)]">
      <div className="min-w-0">
        <h4 className="text-[0.95rem] font-semibold leading-snug text-[--metis-paper]">{issue.title}</h4>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap gap-1">
        <span className={issueTypeChip()}>{issue.issueType}</span>
        <span className={severityChip(issue.severity)}>{issue.severity}</span>
        <span className={statusChip(issue.status)}>{issue.status}</span>
      </div>

      <div className="mt-2 text-[0.68rem] text-[--metis-text-secondary]">
        <span className="font-medium text-[--metis-status-warning-fg]/90">Attention</span>
        {": "}
        <span>{attentionSummaryLabel(issue)}</span>
      </div>

      <p className="mt-2 line-clamp-3 text-[0.72rem] leading-snug text-[--metis-paper-muted]">{issue.summary}</p>

      <p className="mt-2 text-[0.63rem] text-[--metis-text-tertiary]">
        {issue.openGapsCount} {issue.openGapsCount === 1 ? "question" : "questions"} · {issue.sourcesCount}{" "}
        {issue.sourcesCount === 1 ? "source" : "sources"} · Updated {formatUpdatedShort(issue.updatedAt)}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link
          href={base}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full bg-[--metis-brass] px-4 text-[0.8rem] font-medium text-[--metis-dark] transition hover:bg-[--metis-brass-soft]"
        >
          Open issue
          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
        </Link>

        <details className="group relative flex-1 min-w-[9rem]">
          <summary
            aria-label={`More actions for ${issue.title}`}
            className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-4 text-[0.78rem] font-medium text-[--metis-paper] marker:hidden [&::-webkit-details-marker]:hidden"
          >
            More actions
            <ChevronRight className="ml-1 h-3.5 w-3.5 transition group-open:rotate-90" aria-hidden />
          </summary>
          <div className="absolute right-0 z-10 mt-1 min-w-full rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_96%,transparent)] py-1 shadow-lg">
            <Link
              href={`${base}/brief?mode=full`}
              className={
                emphasizeFullRefresh
                  ? "block px-3 py-2 text-[0.75rem] font-medium text-[--metis-brass-soft] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
                  : "block px-3 py-2 text-[0.75rem] text-[--metis-text-secondary] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
              }
            >
              {fullBriefLabel}
            </Link>
            <Link
              href={`${base}/brief?mode=executive`}
              className={
                emphasizeExecRefresh
                  ? "block px-3 py-2 text-[0.75rem] font-medium text-[--metis-brass-soft] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
                  : "block px-3 py-2 text-[0.75rem] text-[--metis-text-secondary] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
              }
            >
              {execBriefLabel}
            </Link>
            <Link
              href={`${base}/messages`}
              className="block px-3 py-2 text-[0.75rem] text-[--metis-text-secondary] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
            >
              Messages
              {issue.messageVariantCount > 0 ? ` (${issue.messageVariantCount})` : ""}
            </Link>
            <Link
              href={`${base}/export`}
              className="block px-3 py-2 text-[0.75rem] text-[--metis-text-secondary] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]"
            >
              Prepare output
            </Link>
            <Link href={`${base}/activity`} className="block px-3 py-2 text-[0.75rem] text-[--metis-text-secondary] hover:bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,transparent)]">
              Activity
            </Link>
          </div>
        </details>
      </div>
    </article>
  );
}
