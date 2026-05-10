import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { IssueActivityKind } from "@metis/shared/activity";
import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";
import { coerceMessageApprovalStatus } from "@/lib/approvals/coerceMessageApprovalStatus";
import { isStoredMessageDraftStale } from "@/lib/messages/messageFreshness";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { MessageVariantArtifactSchema, MessageVariantTemplateIdSchema } from "@metis/shared/messageVariant";
import {
  buildAudienceSnapshot,
  generateExternalCustomerResidentStudentArtifact,
  type ExternalAudienceInput,
} from "@/lib/messages/generateExternalCustomerUpdate";
import { generateInternalStaffUpdateArtifact, type AudienceInput as InternalAudienceInput } from "@/lib/messages/generateInternalStaffUpdate";
import { generateMediaHoldingLineArtifact, type AudienceInput as MediaAudienceInput } from "@/lib/messages/generateMediaHoldingLine";

import { MessagesPanel } from "./messages-panel";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export default async function IssueMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ issueId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { issueId } = await params;
  const sp = (await searchParams) ?? {};
  const lensRaw = typeof sp.lens === "string" ? sp.lens : Array.isArray(sp.lens) ? sp.lens[0] : undefined;
  const templateRaw =
    typeof sp.template === "string" ? sp.template : Array.isArray(sp.template) ? sp.template[0] : undefined;
  const parsedTemplate = MessageVariantTemplateIdSchema.safeParse(templateRaw ?? "external_customer_resident_student");
  const templateId = parsedTemplate.success ? parsedTemplate.data : "external_customer_resident_student";

  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue, organisationId } = pageCtx;

  const activeGroups = await prisma.stakeholderGroup.findMany({
    where: { organisationId, isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  let selectedStakeholderGroupId: string | null = null;

  if (lensRaw === undefined || lensRaw === "" || lensRaw === "issue") {
    selectedStakeholderGroupId = null;
  } else if (UUID_RE.test(lensRaw)) {
    if (activeGroups.some((g) => g.id === lensRaw)) {
      selectedStakeholderGroupId = lensRaw;
    } else {
      const legacyStakeholder = await prisma.issueStakeholder.findFirst({
        where: { id: lensRaw, issueId: issue.id },
        select: { stakeholderGroupId: true },
      });
      if (legacyStakeholder) {
        redirect(`/issues/${issue.id}/messages?lens=${encodeURIComponent(legacyStakeholder.stakeholderGroupId)}`);
      }
      redirect(`/issues/${issue.id}/messages?lens=issue`);
    }
  } else {
    redirect(`/issues/${issue.id}/messages?lens=issue`);
  }

  const latestRow = await prisma.messageVariant.findFirst({
    where: {
      issueId: issue.id,
      templateId,
      stakeholderGroupId: selectedStakeholderGroupId,
    },
    orderBy: [{ versionNumber: "desc" }],
  });

  const messageFreshnessActivitiesRaw =
    latestRow && latestRow.generatedFromIssueUpdatedAt.getTime() < issue.updatedAt.getTime()
      ? await prisma.issueActivity.findMany({
          where: {
            issueId: issue.id,
            createdAt: {
              gt: new Date(Math.max(0, latestRow.generatedFromIssueUpdatedAt.getTime() - 60_000)),
            },
          },
          select: { kind: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const messageFreshnessActivities: { kind: IssueActivityKind; createdAt: Date }[] = messageFreshnessActivitiesRaw.map(
    (r) => ({
      kind: r.kind as IssueActivityKind,
      createdAt: r.createdAt,
    }),
  );
  const savedDraftContentInSync = latestRow
    ? !isStoredMessageDraftStale({
        hasStoredDraft: true,
        generatedFromIssueUpdatedAt: latestRow.generatedFromIssueUpdatedAt,
        issueUpdatedAt: issue.updatedAt,
        activitiesStrictlyAfterRevision: messageFreshnessActivities,
      })
    : false;

  const messagesAiCleanupEnabled = process.env.MESSAGES_AI_CLEANUP_ENABLED === "true";

  const audienceGroupOptions = activeGroups.map((g) => ({
    id: g.id,
    label: g.name,
  }));

  const selectedAudienceGroupLabel =
    selectedStakeholderGroupId === null
      ? "General (no audience group)"
      : (activeGroups.find((g) => g.id === selectedStakeholderGroupId)?.name ?? "Audience group");

  const canUpdateMessageApprovalStatus = membershipAllowsOrgWrite(pageCtx.context.membership.role);

  const initialLatest = latestRow
    ? {
        id: latestRow.id,
        versionNumber: latestRow.versionNumber,
        generatedFromIssueUpdatedAt: latestRow.generatedFromIssueUpdatedAt.toISOString(),
        stakeholderGroupId: latestRow.stakeholderGroupId,
        issueStakeholderId: latestRow.issueStakeholderId,
        artifact: MessageVariantArtifactSchema.parse(latestRow.artifact),
        approvalStatus: coerceMessageApprovalStatus(latestRow.approvalStatus),
        approvalUpdatedAt: latestRow.approvalUpdatedAt?.toISOString() ?? null,
        approvalUpdatedByUserId: latestRow.approvalUpdatedByUserId ?? null,
      }
    : null;

  // Deterministic preview is computed from the issue record on every page load.
  // Saving a MessageVariant row remains an explicit action (history/activity).
  const stakeholderGroup = selectedStakeholderGroupId ? activeGroups.find((g) => g.id === selectedStakeholderGroupId) ?? null : null;
  const issueLens = null;
  const genViewer = { membershipRole: pageCtx.context.membership.role, userId: pageCtx.context.user.id };
  const [sources, gaps, internalInputs, claims] = await Promise.all([
    prisma.source.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId: issue.id }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({
      where: prismaWhereInternalInputsVisibleToViewer(issue.id, genViewer),
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.claim.findMany({ where: { issueId: issue.id }, orderBy: [{ claimNumber: "asc" }] }),
  ]);

  let audience: ExternalAudienceInput;
  let internalAudience: InternalAudienceInput;
  let mediaAudience: MediaAudienceInput;
  if (stakeholderGroup) {
    audience = { kind: "group", group: stakeholderGroup, issueLens };
    internalAudience = { kind: "group", group: stakeholderGroup, issueLens };
    mediaAudience = { kind: "group", group: stakeholderGroup, issueLens };
  } else {
    audience = { kind: "setup" };
    internalAudience = { kind: "setup" };
    mediaAudience = { kind: "setup" };
  }

  const deterministicPreview = (() => {
    if (templateId === "external_customer_resident_student") {
      return generateExternalCustomerResidentStudentArtifact({ issue, sources, gaps, claims, audience });
    }
    if (templateId === "media_holding_line") {
      return generateMediaHoldingLineArtifact({ issue, gaps, claims, audience: mediaAudience });
    }
    return generateInternalStaffUpdateArtifact({ issue, sources, gaps, internalInputs, claims, audience: internalAudience });
  })();

  return (
    <MetisShell
      activePath="/messages"
      pageTitle="Message variants"
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
      <SurfaceCard className="min-w-0 overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-4 sm:px-7 sm:py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-[Cormorant_Garamond] text-[1.8rem] leading-none text-[--metis-paper]">Messages</h2>
            <p className="text-xs text-[--metis-paper-muted]">Deterministic preview + optional AI-enhanced view.</p>
          </div>
        </div>
        <div className="px-6 py-5 sm:px-7 sm:py-6">
          <MessagesPanel
            issueId={issue.id}
            issueTitle={issue.title}
            canUpdateMessageApprovalStatus={canUpdateMessageApprovalStatus}
            savedDraftContentInSync={savedDraftContentInSync}
            selectedTemplateId={templateId}
            audienceGroupOptions={audienceGroupOptions}
            selectedStakeholderGroupId={selectedStakeholderGroupId}
            selectedAudienceGroupLabel={selectedAudienceGroupLabel}
            initialLatest={initialLatest}
            messagesAiCleanupEnabled={messagesAiCleanupEnabled}
            deterministicPreview={deterministicPreview}
          />
          <div className="mt-8 border-t border-[--metis-outline-subtle] pt-6">
            <Link href={`/issues/${issue.id}/export`} className="text-sm text-[--metis-brass-soft] underline-offset-4 hover:underline">
              Circulation package &amp; export →
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}
