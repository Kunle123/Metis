import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { MetisShell } from "@/components/MetisShell";
import { internalInputDbRowToWire } from "@/lib/internalInputs/internalInputWireFormat";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

import { AddToRecordWorkbench } from "./add-to-record-workbench";
import { InputGuidanceRail } from "./input-guidance-rail";
import { InternalInputWorkspace } from "./internal-input-workspace";

export const dynamic = "force-dynamic";

export default async function IssueInternalInputPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const viewer = { membershipRole: pageCtx.context.membership.role, userId: pageCtx.context.user.id };
  const inputsRaw = await prisma.internalInput.findMany({
    where: prismaWhereInternalInputsVisibleToViewer(issue.id, viewer),
    orderBy: [{ createdAt: "desc" }],
  });

  const inputs = inputsRaw
    .map((i) => internalInputDbRowToWire(i))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const canWrite = membershipAllowsOrgWrite(pageCtx.context.membership.role);
  const captureNotesAiEnabled = process.env.NOTES_CAPTURE_AI_ENABLED?.trim() === "true";

  return (
    <MetisShell
      activePath="/input"
      pageTitle="Update record"
      pageMeta="Add material to this issue"
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
      <div className="space-y-6">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-6">
            {canWrite ? (
              <AddToRecordWorkbench
                issueId={issue.id}
                issueRoutePrefix={`/issues/${issue.id}`}
                captureNotesAiEnabled={captureNotesAiEnabled}
              />
            ) : (
              <p className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-5 py-4 text-sm leading-6 text-[--metis-paper-muted]">
                You have view-only access to this issue. You can review observations below but cannot add new material to the record.
              </p>
            )}
          </div>
          <InputGuidanceRail issueId={issue.id} />
        </div>
        <InternalInputWorkspace
          issueId={issue.id}
          inputs={inputs}
          membershipRole={pageCtx.context.membership.role}
          currentUserId={pageCtx.context.user.id}
        />
      </div>
    </MetisShell>
  );
}
