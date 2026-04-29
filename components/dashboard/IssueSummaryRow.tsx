import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { IssueMetaStrip } from "./IssueMetaStrip";
import { IssueStatTile } from "./IssueStatTile";

export type DashboardIssue = {
  id: string;
  title: string;
  summary: string;
  issueType: string;
  severity: string;
  status: string;
  priority: string;
  ownerName: string | null;
  audience: string | null;
  openGapsCount: number;
  sourcesCount: number;
  updatedAt: Date;
};

export function IssueSummaryRow({ issue, workspaceHref }: { issue: DashboardIssue; workspaceHref: string }) {
  const priority = issue.priority;
  const showPriority = priority === "Critical" || priority === "High";
  const showOpenGaps = issue.openGapsCount > 0;
  const isRecentlyUpdated = Date.now() - issue.updatedAt.getTime() < 1000 * 60 * 60 * 6;

  return (
    <div className="group grid gap-5 rounded-[1.65rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 transition hover:border-white/14 hover:bg-white/[0.05] lg:grid-cols-[1.3fr_0.8fr_minmax(200px,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issue.issueType}</Badge>
          <Badge className="border-0 bg-rose-900/35 text-rose-100">{issue.severity}</Badge>
          <Badge className="border-0 bg-emerald-950/35 text-emerald-100">{issue.status}</Badge>
          {showPriority ? <Badge className="border-0 bg-amber-950/40 text-amber-100">{priority} priority</Badge> : null}
          {showOpenGaps ? (
            <Badge className="border-0 bg-[rgba(131,82,17,0.72)] text-amber-50">Open questions · {issue.openGapsCount}</Badge>
          ) : null}
          {isRecentlyUpdated ? <Badge className="border-0 bg-sky-900/35 text-sky-100">Updated recently</Badge> : null}
        </div>
        <div>
          <h4 className="text-lg font-medium text-[--metis-paper]">{issue.title}</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">{issue.summary}</p>
        </div>
      </div>

      <IssueMetaStrip ownerName={issue.ownerName} audience={issue.audience} updatedAt={issue.updatedAt} />

      <div className="min-w-0 rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="grid min-w-0 grid-cols-2 gap-3 border-b border-white/8 pb-4">
          <IssueStatTile label="Open questions" value={issue.openGapsCount} />
          <IssueStatTile label="Sources" value={issue.sourcesCount} />
        </div>
        <Link
          href={workspaceHref}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[--metis-brass-soft] transition group-hover:text-white"
        >
          Issue · Open workspace
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
