import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { GapSchema } from "@metis/shared/gap";

import { GapLedger } from "./gap-ledger";

export const dynamic = "force-dynamic";

export default async function IssueGapsPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const [gapsRaw, internalInputsRaw] = await Promise.all([
    prisma.gap.findMany({ where: { issueId: issue.id } }),
    prisma.internalInput.findMany({
      where: { issueId: issue.id },
      orderBy: [{ createdAt: "desc" }],
      select: { id: true, observationNumber: true, role: true, name: true, createdAt: true },
    }),
  ]);

  const gaps = gapsRaw.map((g) =>
    GapSchema.parse({
      ...g,
      resolvedByInternalInputId: g.resolvedByInternalInputId,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }),
  );

  const internalInputs = internalInputsRaw.map((i) => ({
    id: i.id,
    observationNumber: i.observationNumber,
    role: i.role,
    name: i.name,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <MetisShell
      activePath="/gaps"
      pageTitle="Open questions"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <GapLedger issueId={issue.id} gaps={gaps} internalInputs={internalInputs} issueOpenGapsCount={issue.openGapsCount} />
    </MetisShell>
  );
}
