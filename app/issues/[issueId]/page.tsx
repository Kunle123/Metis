import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { IssueRecordHome } from "@/components/issues/IssueRecordHome";
import { MetisShell } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { activityKindLabel, activityTimelineDisplaySummary, formatActivityTimestamp } from "@/lib/issues/activityTimelineDisplay";
import { enrichActivityRowsForIssue } from "@/lib/issues/enrichActivityTimeline";
import { gatherIssueAttentionSummary } from "@/lib/issues/gatherIssueAttentionSummary";
import { ISSUE_RECORD_ACTIVE_PATH } from "@/lib/issues/issueNav";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

export const dynamic = "force-dynamic";

export default async function IssueRecordPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const page = await loadIssuePageContext(issueId);
  if (page.outcome === "unauthorized") redirect("/login");
  if (page.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (page.outcome === "not_found") notFound();
  const { issue } = page;
  const issueRoutePrefix = `/issues/${issue.id}`;
  const canWrite = membershipAllowsOrgWrite(page.context.membership.role);

  const workspaceViewer = { membershipRole: page.context.membership.role, userId: page.context.user.id };
  const [sourcesCount, gaps, inputsCount, claimsCount, latestBrief, messageVariantCount, activitiesRaw] =
    await Promise.all([
      prisma.source.count({ where: { issueId: issue.id } }),
      prisma.gap.findMany({ where: { issueId: issue.id }, orderBy: [{ updatedAt: "desc" }] }),
      prisma.internalInput.count({
        where: prismaWhereInternalInputsVisibleToViewer(issue.id, workspaceViewer),
      }),
      prisma.claim.count({ where: { issueId: issue.id } }),
      prisma.briefVersion.findFirst({
        where: { issueId: issue.id },
        orderBy: [{ createdAt: "desc" }],
        select: { mode: true, versionNumber: true },
      }),
      prisma.messageVariant.count({ where: { issueId: issue.id } }),
      prisma.issueActivity.findMany({
        where: { issueId: issue.id },
        orderBy: [{ createdAt: "desc" }],
        take: 8,
      }),
    ]);

  const attentionItems = await gatherIssueAttentionSummary({
    issueId: issue.id,
    issueUpdatedAt: issue.updatedAt,
    issueRoutePrefix,
    viewer: workspaceViewer,
    gaps: gaps.map((g) => ({ status: g.status, severity: g.severity })),
  });

  const timelineItems = await enrichActivityRowsForIssue(
    issue.id,
    activitiesRaw.map((a) => ({
      id: a.id,
      kind: a.kind,
      summary: a.summary,
      refType: a.refType,
      refId: a.refId,
      actorLabel: a.actorLabel,
      createdAt: a.createdAt.toISOString(),
    })),
    { viewer: workspaceViewer },
  );

  const recentActivity = timelineItems.slice(0, 5).map((row) => ({
    id: row.id,
    label: activityKindLabel(row.kind),
    summary: activityTimelineDisplaySummary(row),
    when: formatActivityTimestamp(row.createdAt),
  }));

  const briefStatus = latestBrief
    ? `${latestBrief.mode === "executive" ? "Executive" : "Full"} brief v${latestBrief.versionNumber}`
    : "No brief generated yet";

  const stats = [
    {
      label: "Sources",
      value: String(sourcesCount),
      href: `${issueRoutePrefix}/sources`,
      detail: "Evidence and artefacts",
    },
    {
      label: "Input",
      value: String(inputsCount),
      href: `${issueRoutePrefix}/input`,
      detail: "Observations and captured notes",
    },
    {
      label: "Claims",
      value: String(claimsCount),
      href: `${issueRoutePrefix}/claims`,
      detail: "Facts and assumptions register",
    },
    {
      label: "Open questions",
      value: String(issue.openGapsCount ?? gaps.filter((g) => g.status === "Open").length),
      href: `${issueRoutePrefix}/gaps`,
      detail: "Unresolved needs on the tracker",
    },
    {
      label: "Messages",
      value: String(messageVariantCount),
      href: `${issueRoutePrefix}/messages`,
      detail: "Audience drafts",
    },
  ];

  return (
    <MetisShell
      activePath={ISSUE_RECORD_ACTIVE_PATH}
      pageTitle="Issue record"
      pageMeta="Live record"
      organisationMembershipRole={page.context.membership.role}
      issueRoutePrefix={issueRoutePrefix}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <IssueRecordHome
        issueRoutePrefix={issueRoutePrefix}
        title={issue.title}
        status={issue.status}
        severity={issue.severity}
        issueType={issue.issueType}
        ownerName={issue.ownerName}
        canWrite={canWrite}
        attentionItems={attentionItems}
        stats={stats}
        briefStatus={briefStatus}
        recentActivity={recentActivity}
      />
    </MetisShell>
  );
}
