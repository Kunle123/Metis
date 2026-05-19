import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { serializeClaimForViewer } from "@/lib/claims/serializeClaimsForViewer";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";
import { ISSUE_RECORD_ACTIVE_PATH } from "@/lib/issues/issueNav";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";

import { ClaimLedger } from "./claim-ledger";

export const dynamic = "force-dynamic";

const claimInclude = {
  sources: { include: { source: { select: { id: true, sourceCode: true } } } },
  gaps: { include: { gap: { select: { id: true, gapNumber: true } } } },
  internalLinks: {
    include: {
      internalInput: { select: { id: true, observationNumber: true, visibility: true, createdByUserId: true } },
    },
  },
} as const;

export default async function IssueClaimsPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const viewer = { membershipRole: pageCtx.context.membership.role, userId: pageCtx.context.user.id };
  const canWrite = membershipAllowsOrgWrite(pageCtx.context.membership.role);

  const [claimRows, sourcesMini, gapsMini, observationsMini] = await Promise.all([
    prisma.claim.findMany({ where: { issueId: issue.id }, include: claimInclude, orderBy: [{ claimNumber: "asc" }] }),
    prisma.source.findMany({
      where: { issueId: issue.id },
      select: { id: true, sourceCode: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.gap.findMany({
      where: { issueId: issue.id },
      select: { id: true, gapNumber: true },
      orderBy: [{ gapNumber: "asc" }],
    }),
    prisma.internalInput.findMany({
      where: prismaWhereInternalInputsVisibleToViewer(issue.id, viewer),
      select: { id: true, observationNumber: true, role: true, name: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const claims = claimRows.map((r) => serializeClaimForViewer(r, viewer));

  return (
    <MetisShell
      activePath={ISSUE_RECORD_ACTIVE_PATH}
      pageTitle="Claims"
      pageMeta="Record view"
      organisationMembershipRole={pageCtx.context.membership.role}
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <ClaimLedger
        issueId={issue.id}
        canWrite={canWrite}
        claims={claims}
        sources={sourcesMini.map((s) => ({ id: s.id, sourceCode: s.sourceCode }))}
        gaps={gapsMini.map((g) => ({ id: g.id, gapNumber: g.gapNumber ?? null }))}
        observations={observationsMini.map((o) => ({
          id: o.id,
          observationNumber: o.observationNumber,
          role: o.role,
          name: o.name,
        }))}
      />
    </MetisShell>
  );
}
