import type { Issue } from "@prisma/client";
import type { IssueActivityKind } from "@metis/shared/activity";

import { isStoredBriefModeStale } from "@/lib/brief/briefFreshness";
import { prisma } from "@/lib/db/prisma";

export type DashboardIssueVM = Issue & {
  sourcesCount: number;
  messageVariantCount: number;
  exportCount: number;
  hasFullBrief: boolean;
  fullBriefStale: boolean;
  hasExecutiveBrief: boolean;
  executiveBriefStale: boolean;
};

export type DashboardActivityVM = {
  id: string;
  issueId: string;
  issueTitle: string;
  kind: string;
  summary: string;
  actorLabel: string | null;
  createdAt: Date;
};

export type DashboardSnapshot = {
  issues: DashboardIssueVM[];
  /** Cross-issue aggregates for the overview strip */
  aggregates: {
    totalIssues: number;
    issuesWithOpenQuestions: number;
    issuesWithNoSources: number;
    issuesWithMessages: number;
    issuesWithExportedPackage: number;
    /** Stored brief revision may not reflect briefing inputs since substantive activity or issue drift. */
    issuesNeedingBriefRegeneration: number;
  };
  /** Header strip KPIs derived from persisted rows (sums / counts — not estimates). */
  workspacePulse: {
    /** Sum of `Issue.openGapsCount` across listed issues — same posture field used in the ledger. */
    totalTrackedOpenQuestionSlots: number;
    /** Gap rows still Open with severity Critical across those issues. */
    criticalOpenGapsInWorkspace: number;
    /** Total `ArtifactExport` rows belonging to tracked issues. */
    totalStoredExportPackages: number;
  };
  recentActivity: DashboardActivityVM[];
};

function latestBriefDatesByIssue(
  briefs: { issueId: string; mode: string; generatedFromIssueUpdatedAt: Date; versionNumber: number }[],
) {
  const byIssue = new Map<string, Map<string, Date>>();
  for (const b of briefs) {
    let modes = byIssue.get(b.issueId);
    if (!modes) {
      modes = new Map();
      byIssue.set(b.issueId, modes);
    }
    if (!modes.has(b.mode)) {
      modes.set(b.mode, b.generatedFromIssueUpdatedAt);
    }
  }
  return byIssue;
}

export async function getDashboardSnapshot(opts: { organisationId: string }): Promise<DashboardSnapshot> {
  const { organisationId } = opts;

  const issuesRaw = await prisma.issue.findMany({
    where: { organisationId },
    orderBy: [{ lastActivityAt: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          sources: true,
          messageVariants: true,
          artifactExports: true,
        },
      },
    },
  });

  const issueIds = issuesRaw.map((i) => i.id);

  const briefs =
    issueIds.length === 0
      ? []
      : await prisma.briefVersion.findMany({
          where: { issueId: { in: issueIds } },
          select: {
            issueId: true,
            mode: true,
            generatedFromIssueUpdatedAt: true,
            versionNumber: true,
          },
          orderBy: [{ issueId: "asc" }, { mode: "asc" }, { versionNumber: "desc" }],
        });

  const latestByIssue = latestBriefDatesByIssue(briefs);

  let earliestBriefGenMs = Infinity;
  for (const modes of latestByIssue.values()) {
    for (const d of modes.values()) earliestBriefGenMs = Math.min(earliestBriefGenMs, d.getTime());
  }

  const freshnessActivityRows =
    issueIds.length > 0 && Number.isFinite(earliestBriefGenMs)
      ? await prisma.issueActivity.findMany({
          where: {
            issueId: { in: issueIds },
            /** Pull a small window before oldest revision stamp so crossing activities still apply. */
            createdAt: { gt: new Date(Math.max(0, earliestBriefGenMs - 60_000)) },
          },
          select: { issueId: true, kind: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const activitiesByIssue = new Map<string, { kind: IssueActivityKind; createdAt: Date }[]>();
  for (const row of freshnessActivityRows) {
    const list = activitiesByIssue.get(row.issueId) ?? [];
    list.push({ kind: row.kind as IssueActivityKind, createdAt: row.createdAt });
    activitiesByIssue.set(row.issueId, list);
  }

  const issues: DashboardIssueVM[] = issuesRaw.map((row) => {
    const { _count, ...issue } = row;
    const modes = latestByIssue.get(row.id);
    const fullAt = modes?.get("full");
    const execAt = modes?.get("executive");
    const hasFullBrief = Boolean(fullAt);
    const hasExecutiveBrief = Boolean(execAt);
    const postRevisionActs = activitiesByIssue.get(row.id) ?? [];

    const fullBriefStale = isStoredBriefModeStale({
      hasStoredBrief: hasFullBrief,
      generatedFromIssueUpdatedAt: fullAt ?? null,
      issueUpdatedAt: row.updatedAt,
      activitiesStrictlyAfterRevision: postRevisionActs,
    });
    const executiveBriefStale = isStoredBriefModeStale({
      hasStoredBrief: hasExecutiveBrief,
      generatedFromIssueUpdatedAt: execAt ?? null,
      issueUpdatedAt: row.updatedAt,
      activitiesStrictlyAfterRevision: postRevisionActs,
    });

    return {
      ...issue,
      sourcesCount: _count.sources,
      messageVariantCount: _count.messageVariants,
      exportCount: _count.artifactExports,
      hasFullBrief,
      fullBriefStale,
      hasExecutiveBrief,
      executiveBriefStale,
    };
  });

  const recentActivityRaw =
    issueIds.length === 0
      ? []
      : await prisma.issueActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          where: { issueId: { in: issueIds } },
          include: {
            issue: { select: { title: true } },
          },
        });

  const recentActivity: DashboardActivityVM[] = recentActivityRaw.map((a) => ({
    id: a.id,
    issueId: a.issueId,
    issueTitle: a.issue.title,
    kind: a.kind,
    summary: a.summary,
    actorLabel: a.actorLabel,
    createdAt: a.createdAt,
  }));

  const aggregates = {
    totalIssues: issues.length,
    issuesWithOpenQuestions: issues.filter((i) => i.openGapsCount > 0).length,
    issuesWithNoSources: issues.filter((i) => i.sourcesCount === 0).length,
    issuesWithMessages: issues.filter((i) => i.messageVariantCount > 0).length,
    issuesWithExportedPackage: issues.filter((i) => i.exportCount > 0).length,
    issuesNeedingBriefRegeneration: issues.filter((i) => i.fullBriefStale || i.executiveBriefStale).length,
  };

  const totalTrackedOpenQuestionSlots = issues.reduce((sum, i) => sum + i.openGapsCount, 0);

  const [criticalOpenGapsInWorkspace, totalStoredExportPackages] =
    issueIds.length === 0
      ? [0, 0]
      : await Promise.all([
          prisma.gap.count({
            where: { issueId: { in: issueIds }, status: "Open", severity: "Critical" },
          }),
          prisma.artifactExport.count({
            where: { issueId: { in: issueIds } },
          }),
        ]);

  const workspacePulse = {
    totalTrackedOpenQuestionSlots,
    criticalOpenGapsInWorkspace,
    totalStoredExportPackages,
  };

  return { issues, aggregates, workspacePulse, recentActivity };
}
