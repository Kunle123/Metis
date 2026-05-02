import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DashboardIssueVM } from "@/lib/dashboard/getDashboardSnapshot";
import { Badge } from "@/components/ui/badge";

import { IssueMetaStrip } from "./IssueMetaStrip";
import { IssueStatTile } from "./IssueStatTile";

/** @deprecated Prefer `DashboardIssueVM` from `@/lib/dashboard/getDashboardSnapshot`. */
export type DashboardIssue = DashboardIssueVM;

function actionLinkClass(active?: boolean) {
  return [
    "inline-flex max-w-full min-w-0 items-center rounded-full border px-3 py-1.5 text-left text-[0.8rem] font-medium transition",
    active
      ? "border-[--metis-brass]/40 bg-[rgba(191,157,107,0.12)] text-[--metis-paper]"
      : "border-white/10 bg-[rgba(255,255,255,0.04)] text-[--metis-paper-muted] hover:border-white/14 hover:bg-white/[0.07] hover:text-[--metis-paper]",
  ].join(" ");
}

export function IssueSummaryRow({ issue }: { issue: DashboardIssueVM }) {
  const base = `/issues/${issue.id}`;
  const priority = issue.priority;
  const showPriority = priority === "Critical" || priority === "High";
  const showOpenGaps = issue.openGapsCount > 0;
  const isRecentlyActive = Date.now() - issue.lastActivityAt.getTime() < 1000 * 60 * 60 * 24;

  return (
    <div className="grid min-w-0 gap-5 rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 lg:grid-cols-[1.3fr_0.8fr_minmax(200px,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issue.issueType}</Badge>
          <Badge className="border-0 bg-rose-900/35 text-rose-100">{issue.severity}</Badge>
          <Badge className="border-0 bg-emerald-950/35 text-emerald-100">{issue.status}</Badge>
          {showPriority ? <Badge className="border-0 bg-amber-950/40 text-amber-100">{priority} priority</Badge> : null}
          {showOpenGaps ? (
            <Link
              href={`${base}/gaps`}
              className="rounded-full border-0 bg-[rgba(131,82,17,0.72)] px-3 py-1 text-amber-50 text-[0.75rem] font-medium underline-offset-4 hover:underline"
            >
              Open questions · {issue.openGapsCount} — review
            </Link>
          ) : null}
          {issue.sourcesCount === 0 ? (
            <Link
              href={`${base}/sources`}
              className="rounded-full border border-amber-500/35 bg-amber-950/25 px-3 py-1 text-[0.75rem] text-amber-50 underline-offset-4 hover:underline"
            >
              No sources linked — add evidence
            </Link>
          ) : null}
          {issue.fullBriefStale || issue.executiveBriefStale ? (
            <Link
              href={issue.fullBriefStale ? `${base}/brief?mode=full` : `${base}/brief?mode=executive`}
              className="rounded-full border border-sky-500/30 bg-sky-950/30 px-3 py-1 text-[0.75rem] text-sky-100 underline-offset-4 hover:underline"
              title="Stored brief was generated before the latest issue edits."
            >
              Brief may be out of date — open to refresh
            </Link>
          ) : null}
          {isRecentlyActive ? <Badge className="border-0 bg-sky-900/35 text-sky-100">Recent activity</Badge> : null}
        </div>
        <div>
          <Link href={base} className="group/title block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60">
            <h4 className="text-lg font-medium text-[--metis-paper] group-hover/title:text-white">{issue.title}</h4>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">{issue.summary}</p>
            <span className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[--metis-brass-soft] group-hover/title:text-white">
              Open issue workspace
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      <IssueMetaStrip ownerName={issue.ownerName} audience={issue.audience} updatedAt={issue.updatedAt} />

      <div className="flex min-w-0 flex-col rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="grid min-w-0 grid-cols-2 gap-3 border-b border-white/8 pb-4">
          <Link
            href={`${base}/gaps`}
            className="block min-h-0 min-w-0 rounded-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
          >
            <IssueStatTile label="Open questions" value={issue.openGapsCount} />
          </Link>
          <Link
            href={`${base}/sources`}
            className="block min-h-0 min-w-0 rounded-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
          >
            <IssueStatTile label="Sources" value={issue.sourcesCount} />
          </Link>
        </div>

        <nav className="mt-4 flex min-w-0 flex-wrap gap-2" aria-label={`Actions for issue ${issue.title}`}>
          <Link href={`${base}/gaps`} className={actionLinkClass(showOpenGaps)}>
            Review open questions
          </Link>
          <Link href={`${base}/sources`} className={actionLinkClass(issue.sourcesCount === 0)}>
            {issue.sourcesCount === 0 ? "Add sources" : "Manage sources"}
          </Link>
          <Link href={`${base}/brief?mode=full`} className={actionLinkClass(!issue.hasFullBrief || issue.fullBriefStale)}>
            {!issue.hasFullBrief ? "Generate full brief" : issue.fullBriefStale ? "Refresh full brief" : "Review full brief"}
          </Link>
          <Link
            href={`${base}/brief?mode=executive`}
            className={actionLinkClass(!issue.hasExecutiveBrief || issue.executiveBriefStale)}
          >
            {!issue.hasExecutiveBrief ? "Executive brief · generate" : issue.executiveBriefStale ? "Executive brief · refresh" : "Executive brief · review"}
          </Link>
          <Link href={`${base}/messages`} className={actionLinkClass(issue.messageVariantCount === 0)}>
            {issue.messageVariantCount > 0 ? `Messages (${issue.messageVariantCount} draft${issue.messageVariantCount === 1 ? "" : "s"})` : "Open Messages"}
          </Link>
          <Link href={`${base}/export`} className={actionLinkClass(false)}>
            Prepare output
          </Link>
          <Link href={`${base}/activity`} className={actionLinkClass(false)}>
            Activity timeline
          </Link>
        </nav>
      </div>
    </div>
  );
}
