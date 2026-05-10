/**
 * Showcase-only data for seeded issue `22222222-2222-2222-2222-222222222222`.
 * Keeps deterministic fixed UUIDs; called from db/prisma/seed.ts after Source/Gap/Observation rows exist.
 */

import type { Claim, Gap, InternalInput, Issue, PrismaClient, Source } from "@prisma/client";

import { BriefArtifactSchema, type BriefArtifact } from "@metis/shared/briefVersion";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

import type { BriefGenerationInput } from "../../lib/brief/generateBriefFromIssue";
import { generateBriefFromIssue } from "../../lib/brief/generateBriefFromIssue";
import { normalizeObservationVisibility } from "../../lib/internalInputs/internalObservationVisibility";
import { upsertExecutiveExecutiveSummaryAlternateSucceeded } from "../../lib/brief/upsertExecutiveSummaryAlternate";
import { generateInternalStaffUpdateArtifact } from "../../lib/messages/generateInternalStaffUpdate";

/** Aligns seeded brief freshness with issue snapshot moment (deterministic showcase). */
const SHOWCASE_ISSUE_UPDATED_AT = new Date("2026-05-09T13:41:31.000Z");
const BV_FULL_V1_TS = new Date("2026-05-09T10:41:31.000Z");
const BV_EXEC_V1_TS = new Date("2026-05-09T11:41:31.000Z");
const BV_FULL_V2_TS = new Date("2026-05-09T12:41:31.000Z");
const BV_EXEC_V2_TS = new Date("2026-05-09T13:41:31.000Z");

const BV_FULL_V1_ID = "22222222-a111-4111-a111-111111110001";
const BV_FULL_V2_ID = "22222222-a111-4111-a111-111111110002";
const BV_EXEC_V1_ID = "22222222-a222-4222-a222-222222220001";
const BV_EXEC_V2_ID = "22222222-a222-4222-a222-222222220002";

const MSG_VARIANT_V1_ID = "22222222-a333-4333-a333-333333330001";

const EXPORT_DEMO_ID = "22222222-a444-4444-a444-444444440001";

function cloneArtifact(base: BriefArtifact): BriefArtifact {
  return BriefArtifactSchema.parse(JSON.parse(JSON.stringify(base)) as BriefArtifact);
}

/** Append a compare-friendly delta without touching product generation logic elsewhere. */
function buildFullBriefV2(base: BriefArtifact): BriefArtifact {
  const artifact = cloneArtifact(base);
  const rec = artifact.full.sections.find((s) => s.id === "recommended-actions");
  if (rec) {
    rec.body = `${rec.body.trim()}\n\n6) (Demo iteration) Coordinate a succinct “open vs constrained” appendix for the next stakeholder session.`;
  }
  return BriefArtifactSchema.parse(artifact);
}

function buildExecutiveBriefV2(base: BriefArtifact): BriefArtifact {
  const artifact = cloneArtifact(base);
  const actions = [...artifact.executive.immediateActions];
  actions.unshift("(Demo iteration) Align internal language on accessibility mitigations ahead of publication.");
  artifact.executive = { ...artifact.executive, immediateActions: actions };
  const artifactWithAlt = upsertExecutiveExecutiveSummaryAlternateSucceeded(artifact, {
    attemptedAtIso: "2026-05-09T13:42:02.000Z",
    aiAlternateBody: `We are correcting course on consultation accessibility without sounding defensive.\nStakeholders asked for clearer meeting times and translated summaries; assisted sessions are being scheduled.\nFixed constraints remain in planning rules and programme budget—what shifts is sequencing and outreach, validated against internal evidence before external lines change.`,
    limitations: "Demo seeded alternate wording for UI walkthrough; keep claims aligned with deterministic block when presenting externally.",
  });
  return BriefArtifactSchema.parse(artifactWithAlt);
}

async function loadGenerationInput(prisma: PrismaClient, issueId: string): Promise<BriefGenerationInput> {
  const [issueRow, sources, gaps, internalInputs, claims] = await Promise.all([
    prisma.issue.findUniqueOrThrow({ where: { id: issueId } }),
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "asc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ gapNumber: "asc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ observationNumber: "asc" }] }),
    prisma.claim.findMany({ where: { issueId }, orderBy: [{ claimNumber: "asc" }] }),
  ]);
  const issue = issueRow as Issue;
  const showcaseInternalInputs = internalInputs.filter(
    (row) => normalizeObservationVisibility(row.visibility) === "Organisation",
  );

  return {
    issue,
    sources: sources as Source[],
    gaps: gaps as Gap[],
    /** Deterministic stored briefs exclude restricted rows so read-only Viewers never see hidden text in seeded artifacts. */
    internalInputs: showcaseInternalInputs as InternalInput[],
    claims: claims as Claim[],
    messageAudienceGroupNames: [],
  };
}

/** Inserts deterministic briefs, demo message/export; returns refs for IssueActivity rows. */
export async function seedShowcase2222(prisma: PrismaClient): Promise<{
  fullV1Id: string;
  fullV2Id: string;
  execV1Id: string;
  execV2Id: string;
  messageVariantId: string;
  artifactExportId: string;
}> {
  const issueId = "22222222-2222-2222-2222-222222222222";
  await prisma.issue.update({
    where: { id: issueId },
    data: { updatedAt: SHOWCASE_ISSUE_UPDATED_AT },
  });

  const input = await loadGenerationInput(prisma, issueId);

  const fullV1Artifact = BriefArtifactSchema.parse(generateBriefFromIssue(input, "full"));
  const fullV2Artifact = buildFullBriefV2(fullV1Artifact);
  const execV1Artifact = BriefArtifactSchema.parse(generateBriefFromIssue(input, "executive"));
  const execV2Artifact = buildExecutiveBriefV2(execV1Artifact);

  await prisma.briefVersion.create({
    data: {
      id: BV_FULL_V1_ID,
      issueId,
      mode: "full",
      versionNumber: 1,
      generatedFromIssueUpdatedAt: BV_FULL_V1_TS,
      circulationState: "Needs validation",
      circulationNotes: "Demo · full brief seeded for showcase.",
      artifact: fullV1Artifact as object,
      createdAt: BV_FULL_V1_TS,
    },
  });

  await prisma.briefVersion.create({
    data: {
      id: BV_FULL_V2_ID,
      issueId,
      mode: "full",
      versionNumber: 2,
      generatedFromIssueUpdatedAt: BV_FULL_V2_TS,
      circulationState: "Needs validation",
      circulationNotes: "Demo · iterative full brief for compare walkthroughs.",
      artifact: fullV2Artifact as object,
      derivedFromBriefVersionId: BV_FULL_V1_ID,
      createdAt: BV_FULL_V2_TS,
    },
  });

  await prisma.briefVersion.create({
    data: {
      id: BV_EXEC_V1_ID,
      issueId,
      mode: "executive",
      versionNumber: 1,
      generatedFromIssueUpdatedAt: BV_EXEC_V1_TS,
      circulationState: "Ready for review",
      circulationNotes: "Demo · executive seeded for showcase.",
      artifact: execV1Artifact as object,
      createdAt: BV_EXEC_V1_TS,
    },
  });

  await prisma.briefVersion.create({
    data: {
      id: BV_EXEC_V2_ID,
      issueId,
      mode: "executive",
      versionNumber: 2,
      generatedFromIssueUpdatedAt: BV_EXEC_V2_TS,
      circulationState: "Ready for review",
      circulationNotes: "Demo · includes saved alternate executive wording for polish UI.",
      artifact: execV2Artifact as object,
      derivedFromBriefVersionId: BV_EXEC_V1_ID,
      createdAt: BV_EXEC_V2_TS,
    },
  });

  const deterministicMessage = generateInternalStaffUpdateArtifact({
    ...input,
    audience: { kind: "setup" },
  });

  const messageArtifactParsed = MessageVariantArtifactSchema.parse({
    ...deterministicMessage,
    metadata: {
      ...deterministicMessage.metadata,
      aiWordingPolish: "deterministic_only",
      aiComparisonAvailable: false,
      lastRevisionLabel: "13:41 Demo",
      openGapsLabel: deterministicMessage.metadata.openGapsLabel,
      audienceLabel: deterministicMessage.metadata.audienceLabel,
    },
  });

  await prisma.messageVariant.create({
    data: {
      id: MSG_VARIANT_V1_ID,
      issueId,
      templateId: "internal_staff_update",
      versionNumber: 1,
      generatedFromIssueUpdatedAt: SHOWCASE_ISSUE_UPDATED_AT,
      stakeholderGroupId: null,
      issueStakeholderId: null,
      audienceSnapshot: { kind: "issue_audience_seed" },
      artifact: messageArtifactParsed as object,
      createdAt: BV_EXEC_V2_TS,
    },
  });

  const demoExportHtml =
    "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"/><title>Metis demo export</title></head><body>" +
    "<article><p><strong>Fictional demo HTML export snapshot</strong> — seeded so Activity and export history look plausible in walkthroughs.</p>" +
    "<p>Open <em>Prepare output → Export</em> flow to regenerate from the latest brief at any time.</p></article>" +
    "</body></html>";

  await prisma.artifactExport.create({
    data: {
      id: EXPORT_DEMO_ID,
      issueId,
      briefVersionId: BV_FULL_V2_ID,
      mode: "full",
      format: "full-issue-brief",
      filename: `metis-${issueId}-full-issue-brief-v2-demo.html`,
      mimeType: "text/html",
      content: demoExportHtml,
      createdAt: new Date(BV_EXEC_V2_TS.getTime() + 3 * 60 * 1000),
    },
  });

  return {
    fullV1Id: BV_FULL_V1_ID,
    fullV2Id: BV_FULL_V2_ID,
    execV1Id: BV_EXEC_V1_ID,
    execV2Id: BV_EXEC_V2_ID,
    messageVariantId: MSG_VARIANT_V1_ID,
    artifactExportId: EXPORT_DEMO_ID,
  };
}
