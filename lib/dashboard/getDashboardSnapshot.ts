import type { Issue } from "@prisma/client";

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
    /** Stored brief exists but predates latest issue edits (regeneration may be needed). */
    issuesNeedingBriefRegeneration: number;
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

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const issuesRaw = await prisma.issue.findMany({
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

  const issues: DashboardIssueVM[] = issuesRaw.map((row) => {
    const { _count, ...issue } = row;
    const modes = latestByIssue.get(row.id);
    const fullAt = modes?.get("full");
    const execAt = modes?.get("executive");
    const hasFullBrief = Boolean(fullAt);
    const hasExecutiveBrief = Boolean(execAt);
    const fullBriefStale = hasFullBrief && fullAt!.getTime() < row.updatedAt.getTime();
    const executiveBriefStale = hasExecutiveBrief && execAt!.getTime() < row.updatedAt.getTime();

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

  return { issues, aggregates, recentActivity };
}
