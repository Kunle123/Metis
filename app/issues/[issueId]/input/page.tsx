import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { MetisShell } from "@/components/MetisShell";
import { internalInputDbRowToWire } from "@/lib/internalInputs/internalInputWireFormat";

import { InternalInputWorkspace } from "./internal-input-workspace";

export const dynamic = "force-dynamic";

export default async function IssueInternalInputPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const inputsRaw = await prisma.internalInput.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const inputs = inputsRaw
    .map((i) => internalInputDbRowToWire(i))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <MetisShell
      activePath="/input"
      pageTitle="Internal observations"
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
      <InternalInputWorkspace issueId={issue.id} inputs={inputs} />
    </MetisShell>
  );
}
