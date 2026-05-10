import type { IssueActivityKind } from "@metis/shared/activity";
import type { BriefMode } from "@metis/shared/briefVersion";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";
import type { ObservationViewer } from "@/lib/internalInputs/internalObservationVisibility";
import { organisationMembershipIsAdmin } from "@/lib/internalInputs/internalObservationVisibility";
import { prisma } from "@/lib/db/prisma";
import { isStoredBriefModeStale } from "@/lib/brief/briefFreshness";
import { isStoredMessageDraftStale } from "@/lib/messages/messageFreshness";
import { coerceMessageApprovalStatus } from "@/lib/approvals/coerceMessageApprovalStatus";
import { evaluateClaimAlignmentForText, flattenMessageArtifactForClaimAlignment } from "@/lib/conflicts/claimAlignment";
import { coerceClaimStatus } from "@/lib/claims/coerceClaimStatus";
import { formatClaimCode } from "@/lib/issueRecordCodes";

import {
  approvalCoordinationNeedsAttention,
  buildIssueAttentionSummary,
  type IssueAttentionBuilderInput,
  type IssueAttentionItem,
} from "./issueAttentionSummary";

export type GatherIssueAttentionParams = {
  issueId: string;
  issueUpdatedAt: Date;
  /** `/issues/:id` */
  issueRoutePrefix: string;
  viewer: ObservationViewer;
  /** When provided, skips an extra Gap query if the workspace page already fetched rows. */
  gaps?: Array<{ status: string; severity: string }>;
};

function facetFromBriefRow(
  row: {
    generatedFromIssueUpdatedAt: Date;
  } | null,
  issueUpdatedAt: Date,
  activitiesMapped: Array<{ kind: IssueActivityKind; createdAt: Date }>,
): { hasStored: boolean; needsRefresh: boolean } {
  if (!row) return { hasStored: false, needsRefresh: false };
  return {
    hasStored: true,
    needsRefresh: isStoredBriefModeStale({
      hasStoredBrief: true,
      generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
      issueUpdatedAt,
      activitiesStrictlyAfterRevision: activitiesMapped,
    }),
  };
}

function varianceKey(templateId: string, stakeholderGroupId: string | null) {
  return `${templateId}\0${stakeholderGroupId ?? ""}`;
}

/**
 * Loads issue-derived facts server-side then runs `buildIssueAttentionSummary`.
 */
export async function gatherIssueAttentionSummary(params: GatherIssueAttentionParams): Promise<IssueAttentionItem[]> {
  const { issueId, issueUpdatedAt, issueRoutePrefix, viewer, gaps: gapsProvided } = params;

  const [
    gapsFromDb,
    claimGrouped,
    latestFullBrief,
    latestExecBrief,
    messageVariantRows,
    latestExport,
    claimsForAlignment,
    restrictedTotals,
  ] = await Promise.all([
    gapsProvided !== undefined ? Promise.resolve(gapsProvided) :
    prisma.gap.findMany({
      where: { issueId },
      select: { status: true, severity: true },
    }),
    prisma.claim.groupBy({
      by: ["status"],
      where: { issueId },
      _count: { _all: true },
    }),
    prisma.briefVersion.findFirst({
      where: { issueId, mode: "full" as BriefMode },
      orderBy: { createdAt: "desc" },
      select: { generatedFromIssueUpdatedAt: true },
    }),
    prisma.briefVersion.findFirst({
      where: { issueId, mode: "executive" as BriefMode },
      orderBy: { createdAt: "desc" },
      select: { generatedFromIssueUpdatedAt: true },
    }),
    prisma.messageVariant.findMany({
      where: { issueId },
      select: {
        templateId: true,
        stakeholderGroupId: true,
        versionNumber: true,
        generatedFromIssueUpdatedAt: true,
        approvalStatus: true,
        artifact: true,
      },
    }),
    prisma.artifactExport.findFirst({
      where: { issueId },
      orderBy: { createdAt: "desc" },
      select: { approvalStatus: true },
    }),
    prisma.claim.findMany({
      where: { issueId },
      orderBy: { claimNumber: "asc" },
      select: { claimNumber: true, text: true, status: true, notes: true, id: true },
    }),
    (async () => {
      const isAdmin = organisationMembershipIsAdmin(viewer.membershipRole);
      if (isAdmin) {
        const n = await prisma.internalInput.count({
          where: { issueId, visibility: "Restricted" },
        });
        return { show: n > 0 };
      }
      const n = await prisma.internalInput.count({
        where: {
          issueId,
          visibility: "Restricted",
          createdByUserId: viewer.userId,
        },
      });
      return { show: n > 0 };
    })(),
  ]);

  const needsValidationClaimsCount =
    claimGrouped.find((g) => g.status === "NeedsValidation")?._count._all ?? 0;
  const assumptionClaimsCount = claimGrouped.find((g) => g.status === "Assumption")?._count._all ?? 0;

  const activityFloorCandidates: number[] = [];
  const pushFloor = (d: Date | null | undefined) => {
    if (!d) return;
    if (d.getTime() >= issueUpdatedAt.getTime()) return;
    activityFloorCandidates.push(Math.max(0, d.getTime() - 60_000));
  };

  if (latestFullBrief) pushFloor(latestFullBrief.generatedFromIssueUpdatedAt);
  if (latestExecBrief) pushFloor(latestExecBrief.generatedFromIssueUpdatedAt);

  const latestByLens = new Map<
    string,
    { generatedFromIssueUpdatedAt: Date; approvalStatus: string; artifact: unknown; versionNumber: number }
  >();
  for (const row of messageVariantRows) {
    const k = varianceKey(row.templateId, row.stakeholderGroupId);
    const prev = latestByLens.get(k);
    if (!prev || row.versionNumber > prev.versionNumber) {
      latestByLens.set(k, {
        generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt,
        approvalStatus: row.approvalStatus,
        artifact: row.artifact,
        versionNumber: row.versionNumber,
      });
    }
  }

  for (const v of latestByLens.values()) {
    pushFloor(v.generatedFromIssueUpdatedAt);
  }

  let activitiesMapped: Array<{ kind: IssueActivityKind; createdAt: Date }> = [];
  if (activityFloorCandidates.length > 0) {
    const floorMs = Math.min(...activityFloorCandidates);
    const raw = await prisma.issueActivity.findMany({
      where: {
        issueId,
        createdAt: { gt: new Date(floorMs) },
      },
      select: { kind: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    activitiesMapped = raw.map((r) => ({
      kind: r.kind as IssueActivityKind,
      createdAt: r.createdAt,
    }));
  }

  function activitiesAfter(gen: Date) {
    return activitiesMapped.filter((a) => a.createdAt.getTime() > gen.getTime());
  }

  const briefFullFacet = facetFromBriefRow(latestFullBrief, issueUpdatedAt, latestFullBrief
    ? activitiesAfter(latestFullBrief.generatedFromIssueUpdatedAt)
    : []);
  const briefExecFacet = facetFromBriefRow(latestExecBrief, issueUpdatedAt, latestExecBrief
    ? activitiesAfter(latestExecBrief.generatedFromIssueUpdatedAt)
    : []);

  let anyMessageDraftStale = false;
  let latestMessageVariantsNeedCoordination = false;
  let aggregateAlignment: IssueAttentionBuilderInput["messageClaimAlignment"] = null;

  const alignmentClaimsInputs = claimsForAlignment.map((c) => ({
    id: c.id,
    claimCode: formatClaimCode(c.claimNumber) ?? `CLM-${String(c.claimNumber).padStart(3, "0")}`,
    text: c.text,
    status: coerceClaimStatus(c.status),
    notes: c.notes ?? null,
  }));

  if (latestByLens.size > 0) {
    let hasCrit = false;
    let hasNonCrit = false;
    let evaluatedAnyDraft = false;

    for (const v of latestByLens.values()) {
      const stale = isStoredMessageDraftStale({
        hasStoredDraft: true,
        generatedFromIssueUpdatedAt: v.generatedFromIssueUpdatedAt,
        issueUpdatedAt,
        activitiesStrictlyAfterRevision: activitiesAfter(v.generatedFromIssueUpdatedAt),
      });
      if (stale) anyMessageDraftStale = true;

      const approval = coerceMessageApprovalStatus(v.approvalStatus);
      if (approvalCoordinationNeedsAttention(approval)) {
        latestMessageVariantsNeedCoordination = true;
      }

      const parsed = MessageVariantArtifactSchema.safeParse(v.artifact);
      if (!parsed.success) continue;
      evaluatedAnyDraft = true;
      const findings = evaluateClaimAlignmentForText(
        flattenMessageArtifactForClaimAlignment(parsed.data),
        alignmentClaimsInputs,
      );
      for (const f of findings) {
        if (f.severity === "critical") hasCrit = true;
        if (f.severity === "warning" || f.severity === "info") hasNonCrit = true;
      }
    }

    aggregateAlignment =
      evaluatedAnyDraft && (hasCrit || hasNonCrit)
        ? { hasCriticalFindings: hasCrit, hasNonCriticalFindings: hasNonCrit }
        : null;
  }

  const exportCoordination =
    latestExport && approvalCoordinationNeedsAttention(coerceMessageApprovalStatus(latestExport.approvalStatus));

  /** Restricted cue only when observer has non-leaky visibility surface (admin or own restricted rows). */
  const showRestrictedObservationInfo = restrictedTotals.show === true;

  const builderInput: IssueAttentionBuilderInput = {
    issueRoutePrefix,
    gaps: (gapsFromDb ?? []).map((g) => ({ status: g.status, severity: g.severity })),
    needsValidationClaimsCount,
    assumptionClaimsCount,
    brief: { full: briefFullFacet, executive: briefExecFacet },
    anyMessageDraftStale,
    messageClaimAlignment: aggregateAlignment,
    latestMessageVariantsNeedCoordination,
    latestExportNeedsCoordination: Boolean(exportCoordination),
    showRestrictedObservationInfo,
  };

  return buildIssueAttentionSummary(builderInput);
}
