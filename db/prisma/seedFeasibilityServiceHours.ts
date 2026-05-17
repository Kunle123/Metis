/**
 * Dev/staging QA issue: live-record feasibility test for service opening-hours consultation.
 * Deterministic fixed UUIDs; safe to re-run (issue delete + recreate).
 */

import type { PrismaClient } from "@prisma/client";

import { DEMO_ORGANISATION_ID } from "@/lib/organisations/demoOrganisation";

export const FEASIBILITY_SERVICE_HOURS_ISSUE_ID = "44444444-4444-4444-4444-444444444444";

const DEMO_ACTOR = "demo.operator@metis.local";

const SOURCE_IDS = {
  operations: "44444444-0000-0000-0000-000000000101",
  councillor: "44444444-0000-0000-0000-000000000102",
  planning: "44444444-0000-0000-0000-000000000103",
  serviceManager: "44444444-0000-0000-0000-000000000104",
  social: "44444444-0000-0000-0000-000000000105",
} as const;

const OBS_IDS = {
  comms: "44444444-0000-0000-0000-000000000701",
  operations: "44444444-0000-0000-0000-000000000702",
  policy: "44444444-0000-0000-0000-000000000703",
  customer: "44444444-0000-0000-0000-000000000704",
  executive: "44444444-0000-0000-0000-000000000705",
} as const;

const GAP_IDS = {
  proposedHours: "44444444-0000-0000-0000-000000000401",
  signOff: "44444444-0000-0000-0000-000000000402",
  equality: "44444444-0000-0000-0000-000000000403",
  councillorLine: "44444444-0000-0000-0000-000000000404",
  mediaFallback: "44444444-0000-0000-0000-000000000405",
  statementOwner: "44444444-0000-0000-0000-000000000406",
} as const;

const STAKEHOLDER_GROUP_IDS = {
  serviceUsers: "44444444-a001-4001-8001-000000000001",
  councillors: "44444444-a002-4002-8002-000000000002",
  staff: "44444444-a003-4003-8003-000000000003",
} as const;

const ISSUE_STAKEHOLDER_IDS = {
  serviceUsers: "44444444-b001-4101-8101-000000000001",
  councillors: "44444444-b002-4102-8102-000000000002",
  staff: "44444444-b003-4103-8103-000000000003",
} as const;

const ACTIVITY_IDS = [
  "44444444-cccc-cccc-cccc-cccccccccc01",
  "44444444-cccc-cccc-cccc-cccccccccc02",
  "44444444-cccc-cccc-cccc-cccccccccc03",
  "44444444-cccc-cccc-cccc-cccccccccc04",
] as const;

type ClaimSeed = {
  id: string;
  claimNumber: number;
  status: "Confirmed" | "Assumption" | "NeedsValidation" | "Superseded";
  text: string;
  notes: string | null;
  sourceIds: string[];
  observationIds: string[];
};

const CLAIMS: readonly ClaimSeed[] = [
  {
    id: "44444444-d111-4111-a111-111111111101",
    claimNumber: 1,
    status: "Confirmed",
    text: "Consultation options for service opening hours are under review.",
    notes: null,
    sourceIds: [SOURCE_IDS.operations, SOURCE_IDS.planning],
    observationIds: [OBS_IDS.comms],
  },
  {
    id: "44444444-d111-4111-a111-111111111102",
    claimNumber: 2,
    status: "Confirmed",
    text: "No final decision has been made on the proposed opening-hours change.",
    notes: null,
    sourceIds: [SOURCE_IDS.councillor, SOURCE_IDS.planning],
    observationIds: [OBS_IDS.comms],
  },
  {
    id: "44444444-d111-4111-a111-111111111103",
    claimNumber: 3,
    status: "Confirmed",
    text: "Staffing pressure and uneven usage patterns are part of the reason the opening-hours model is being reviewed.",
    notes: null,
    sourceIds: [SOURCE_IDS.planning, SOURCE_IDS.serviceManager],
    observationIds: [OBS_IDS.operations],
  },
  {
    id: "44444444-d111-4111-a111-111111111104",
    claimNumber: 4,
    status: "Assumption",
    text: "A late-evening slot may offset some reduced weekday access.",
    notes: "Working assumption only; requires consultation and equality assessment.",
    sourceIds: [SOURCE_IDS.serviceManager],
    observationIds: [],
  },
  {
    id: "44444444-d111-4111-a111-111111111105",
    claimNumber: 5,
    status: "NeedsValidation",
    text: "The proposed change will save money without reducing service quality.",
    notes: "Do not state externally until finance/service assessment is confirmed.",
    sourceIds: [SOURCE_IDS.planning],
    observationIds: [],
  },
  {
    id: "44444444-d111-4111-a111-111111111106",
    claimNumber: 6,
    status: "NeedsValidation",
    text: "The equality impact assessment will be complete before public consultation opens.",
    notes: "Timing not yet confirmed.",
    sourceIds: [],
    observationIds: [OBS_IDS.policy],
  },
  {
    id: "44444444-d111-4111-a111-111111111107",
    claimNumber: 7,
    status: "Superseded",
    text: "The service will close earlier from next month.",
    notes: "Public rumour/social claim; inaccurate based on current record.",
    sourceIds: [SOURCE_IDS.social],
    observationIds: [],
  },
  {
    id: "44444444-d111-4111-a111-111111111108",
    claimNumber: 8,
    status: "NeedsValidation",
    text: "Older residents and working families will not be adversely affected.",
    notes: "Requires equality assessment and consultation feedback.",
    sourceIds: [SOURCE_IDS.councillor],
    observationIds: [OBS_IDS.policy],
  },
];

async function syncClaimLinks(
  prisma: PrismaClient,
  claimId: string,
  sourceIds: string[],
  observationIds: string[],
) {
  await prisma.claimSource.deleteMany({ where: { claimId } });
  await prisma.claimInternalInput.deleteMany({ where: { claimId } });
  if (sourceIds.length > 0) {
    await prisma.claimSource.createMany({
      data: sourceIds.map((sourceId) => ({ claimId, sourceId })),
      skipDuplicates: true,
    });
  }
  if (observationIds.length > 0) {
    await prisma.claimInternalInput.createMany({
      data: observationIds.map((internalInputId) => ({ claimId, internalInputId })),
      skipDuplicates: true,
    });
  }
}

export async function seedFeasibilityServiceHours(prisma: PrismaClient): Promise<{
  issueId: string;
  sources: number;
  observations: number;
  claims: number;
  gaps: number;
  audienceGroups: number;
}> {
  await prisma.issue.deleteMany({ where: { id: FEASIBILITY_SERVICE_HOURS_ISSUE_ID } });

  const stakeholderGroups = [
    {
      id: STAKEHOLDER_GROUP_IDS.serviceUsers,
      name: "Service users",
      description: "People who use the service day to day.",
      defaultSensitivity: "External-facing; consultation integrity matters.",
      defaultChannels: "Web update, front desk, community sessions",
      defaultToneGuidance: "Plain language; reassurance that consultation is genuine.",
      displayOrder: 50,
      needsToKnow:
        "Need plain-language reassurance that consultation is genuine and no final decision has been made.",
    },
    {
      id: STAKEHOLDER_GROUP_IDS.councillors,
      name: "Councillors and community representatives",
      description: "Elected members and community representatives seeking process clarity.",
      defaultSensitivity: "Sensitive; align with governance timelines.",
      defaultChannels: "Member briefing, written response, 1:1",
      defaultToneGuidance: "Clear on process, decision status, and equality assessment.",
      displayOrder: 51,
      needsToKnow:
        "Need a clear line on process, decision status and equality assessment.",
    },
    {
      id: STAKEHOLDER_GROUP_IDS.staff,
      name: "Staff",
      description: "Front-line and service staff handling enquiries.",
      defaultSensitivity: "Internal; keep aligned with approved consultation lines.",
      defaultChannels: "Manager cascade, intranet, team briefing",
      defaultToneGuidance: "Consistent, practical; avoid speculation on hours.",
      displayOrder: 52,
      needsToKnow: "Need consistent language for front desk and customer questions.",
    },
  ] as const;

  for (const group of stakeholderGroups) {
    await prisma.stakeholderGroup.upsert({
      where: {
        organisationId_name: {
          organisationId: DEMO_ORGANISATION_ID,
          name: group.name,
        },
      },
      create: {
        id: group.id,
        organisationId: DEMO_ORGANISATION_ID,
        name: group.name,
        description: group.description,
        defaultSensitivity: group.defaultSensitivity,
        defaultChannels: group.defaultChannels,
        defaultToneGuidance: group.defaultToneGuidance,
        displayOrder: group.displayOrder,
      },
      update: {
        description: group.description,
        defaultSensitivity: group.defaultSensitivity,
        defaultChannels: group.defaultChannels,
        defaultToneGuidance: group.defaultToneGuidance,
        displayOrder: group.displayOrder,
        isActive: true,
      },
    });
  }

  const sources = [
    {
      id: SOURCE_IDS.operations,
      sourceCode: "SRC-001",
      tier: "Internal operational update",
      title: "Operations update on drop-in attendance",
      note: "Internal email summarising consultation drop-in demand and front-desk questions.",
      snippet:
        "We are seeing higher-than-normal attendance at the consultation drop-in sessions. Front desk says some visitors are asking whether evening hours are already confirmed, which they are not. Staff are asking for a consistent line before the next session.",
      reliability: "High",
      linkedSection: "Operations",
      url: null,
      timestampLabel: "This week (feasibility seed)",
    },
    {
      id: SOURCE_IDS.councillor,
      sourceCode: "SRC-002",
      tier: "Stakeholder correspondence",
      title: "Councillor enquiry on perceived service reduction",
      note: "Incoming councillor email raising resident concerns.",
      snippet:
        "Residents are worried this is a backdoor service reduction. Can you confirm whether any decision has already been made, and whether the proposed changes will reduce access for older residents and working families?",
      reliability: "Moderate",
      linkedSection: "Stakeholder correspondence",
      url: null,
      timestampLabel: "Yesterday (feasibility seed)",
    },
    {
      id: SOURCE_IDS.planning,
      sourceCode: "SRC-003",
      tier: "Internal planning note",
      title: "Draft options note on opening-hours model",
      note: "Working options paper — not approved for external use.",
      snippet:
        "Option under review: reduce weekday opening by two hours and add one late evening slot. This option has not been approved. Finance and service management are still testing whether it addresses staffing constraints without reducing overall service accessibility.",
      reliability: "High",
      linkedSection: "Planning",
      url: null,
      timestampLabel: "Draft v0.3 (feasibility seed)",
    },
    {
      id: SOURCE_IDS.serviceManager,
      sourceCode: "SRC-004",
      tier: "Internal call note",
      title: "Service manager call note on staffing constraint",
      note: "Notes from service manager call.",
      snippet:
        "Staffing rota is the main operational constraint. Saturday coverage remains unresolved. The service manager believes a late-evening slot may help some users, but this needs to be tested through consultation and equality review.",
      reliability: "High",
      linkedSection: "Operations",
      url: null,
      timestampLabel: "Call note (feasibility seed)",
    },
    {
      id: SOURCE_IDS.social,
      sourceCode: "SRC-005",
      tier: "Public/social monitoring",
      title: "Local group post about early closure",
      note: "Social monitoring flag — inaccurate public claim.",
      snippet:
        "A local community group has posted that the service is 'closing early from next month'. This is inaccurate based on the current record, but the post is gaining traction and has prompted questions from service users.",
      reliability: "Moderate",
      linkedSection: "Public narrative",
      url: null,
      timestampLabel: "Social monitoring (feasibility seed)",
    },
  ] as const;

  const gaps = [
    {
      id: GAP_IDS.proposedHours,
      title: "What precise opening-hours option is being proposed for consultation?",
      whyItMatters: "Without this, external lines must remain provisional.",
      stakeholder: "Operations",
      linkedSection: "Planning",
      severity: "Critical",
      status: "Open",
      prompt: "What precise opening-hours option is being proposed for consultation?",
    },
    {
      id: GAP_IDS.signOff,
      title: "Who signs off the consultation wording before it is shared with councillors or the public?",
      whyItMatters: "Sign-off route affects timing and message discipline.",
      stakeholder: "Executive office",
      linkedSection: "Governance",
      severity: "Important",
      status: "Open",
      prompt: "Who signs off the consultation wording before it is shared with councillors or the public?",
    },
    {
      id: GAP_IDS.equality,
      title: "When will the equality impact assessment be available?",
      whyItMatters: "Equality timing constrains what can be said about impact.",
      stakeholder: "Policy",
      linkedSection: "Equality",
      severity: "Important",
      status: "Open",
      prompt: "When will the equality impact assessment be available?",
    },
    {
      id: GAP_IDS.councillorLine,
      title: "What can be said to councillors before the proposal is formally approved?",
      whyItMatters: "Councillor enquiries are active; lines must stay within the record.",
      stakeholder: "Comms",
      linkedSection: "Stakeholder correspondence",
      severity: "Important",
      status: "Open",
      prompt: "What can be said to councillors before the proposal is formally approved?",
    },
    {
      id: GAP_IDS.mediaFallback,
      title: "What is the fallback line if local media ask whether this is a service cut?",
      whyItMatters: "Media risk is rising from inaccurate social claims.",
      stakeholder: "Comms",
      linkedSection: "Public narrative",
      severity: "Important",
      status: "Open",
      prompt: "What is the fallback line if local media ask whether this is a service cut?",
    },
    {
      id: GAP_IDS.statementOwner,
      title: "Who owns the final external statement and media enquiry route?",
      whyItMatters: "Clear ownership prevents inconsistent responses.",
      stakeholder: "Communications lead",
      linkedSection: null,
      severity: "Watch",
      status: "Open",
      prompt: "Who owns the final external statement and media enquiry route?",
    },
  ] as const;

  const internalInputs = [
    {
      id: OBS_IDS.comms,
      role: "Comms",
      name: "Amara Lewis",
      response:
        "We need to avoid language that implies the decision is already made. The safest line is that options are under review and that consultation feedback will shape the final recommendation.",
      confidence: "Confirmed",
      excludedFromBrief: false,
      linkedSection: "Message discipline",
      visibility: "Organisation",
      timestampLabel: "Comms note (feasibility seed)",
    },
    {
      id: OBS_IDS.operations,
      role: "Operations",
      name: "Daniel Price",
      response:
        "The operational reason for looking at hours is staffing pressure and uneven demand through the day. We cannot yet say that the current option preserves access because the equality assessment is not complete.",
      confidence: "Likely",
      excludedFromBrief: false,
      linkedSection: "Operations",
      visibility: "Organisation",
      timestampLabel: "Operations note (feasibility seed)",
    },
    {
      id: OBS_IDS.policy,
      role: "Policy",
      name: "Priya Raman",
      response:
        "The equality impact assessment is not complete. We should avoid any public wording that says the change has no adverse impact until that assessment is available.",
      confidence: "Confirmed",
      excludedFromBrief: false,
      linkedSection: "Equality",
      visibility: "Organisation",
      timestampLabel: "Policy note (feasibility seed)",
    },
    {
      id: OBS_IDS.customer,
      role: "Customer team",
      name: "Ben Carter",
      response:
        "People are asking for the exact proposed hours, but staff do not yet have a signed-off option to share. This is creating inconsistent verbal responses at the front desk.",
      confidence: "Confirmed",
      excludedFromBrief: false,
      linkedSection: "Front desk",
      visibility: "Organisation",
      timestampLabel: "Customer team note (feasibility seed)",
    },
    {
      id: OBS_IDS.executive,
      role: "Executive office",
      name: "Marcus Hale",
      response:
        "The chief executive wants a short line for councillors by tomorrow morning. The line should explain the consultation position without committing to specific hours or impacts before approval.",
      confidence: "Likely",
      excludedFromBrief: false,
      linkedSection: "Leadership",
      visibility: "Organisation",
      timestampLabel: "Executive office note (feasibility seed)",
    },
  ] as const;

  const openGapsCount = gaps.filter((g) => g.status === "Open").length;

  await prisma.issue.create({
    data: {
      id: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
      organisationId: DEMO_ORGANISATION_ID,
      title: "Consultation on Proposed Changes to Service Opening Hours",
      summary:
        "Feasibility QA record: a live-style comms issue on proposed service opening-hours consultation. The record mixes operational updates, stakeholder correspondence, planning notes, and social monitoring with internal observations, claims, and open questions — intended to test whether Metis can produce a valuable executive brief and controlled messages without over-claiming.",
      confirmedFacts: [
        "Consultation options for service opening hours are under review.",
        "No final decision has been made on the proposed opening-hours change.",
        "Staffing pressure and uneven usage patterns are among the drivers for reviewing the hours model.",
        "Public social claims about imminent early closure are inaccurate based on the current record.",
      ].join("\n"),
      openQuestions: [
        "What precise opening-hours option is being proposed for consultation?",
        "Who signs off consultation wording before councillor/public share?",
        "When will the equality impact assessment be available?",
        "What can be said to councillors before formal approval?",
        "What is the media fallback if asked whether this is a service cut?",
        "Who owns the final external statement and media enquiry route?",
      ].join("\n"),
      context: [
        "This is a dev/staging feasibility seed — not production content and not a public demo route.",
        "Message discipline: avoid implying a decision is made; do not state final hours, confirmed savings, no adverse equality impact, or that early closure is happening next month until the record supports it.",
        "Immediate leadership decisions likely concern sign-off route, proposed-hours clarity, and councillor/media lines.",
      ].join("\n\n"),
      issueType: "Consultation briefing",
      severity: "High",
      status: "Ready to brief",
      priority: "Normal",
      operatorPosture: "Active",
      ownerName: "Casey Morgan",
      audience:
        "Service users, staff, elected representatives, local community groups and local media. The organisation must avoid implying the decision is already made before consultation material and equality assessment are confirmed.",
      openGapsCount,
      sourcesCount: sources.length,
      gapCodeSeq: gaps.length,
      observationCodeSeq: internalInputs.length,
      claimCodeSeq: CLAIMS.length,
    },
  });

  for (const s of sources) {
    await prisma.source.create({
      data: {
        id: s.id,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        sourceCode: s.sourceCode,
        tier: s.tier,
        title: s.title,
        note: s.note,
        snippet: s.snippet,
        reliability: s.reliability,
        linkedSection: s.linkedSection,
        url: s.url,
        timestampLabel: s.timestampLabel,
      },
    });
  }

  for (let gi = 0; gi < gaps.length; gi++) {
    const g = gaps[gi]!;
    await prisma.gap.create({
      data: {
        id: g.id,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        gapNumber: gi + 1,
        title: g.title,
        whyItMatters: g.whyItMatters,
        stakeholder: g.stakeholder,
        linkedSection: g.linkedSection,
        severity: g.severity,
        status: g.status,
        prompt: g.prompt,
      },
    });
  }

  for (let oi = 0; oi < internalInputs.length; oi++) {
    const i = internalInputs[oi]!;
    await prisma.internalInput.create({
      data: {
        id: i.id,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        observationNumber: oi + 1,
        role: i.role,
        name: i.name,
        response: i.response,
        confidence: i.confidence,
        excludedFromBrief: i.excludedFromBrief,
        linkedSection: i.linkedSection,
        visibility: i.visibility,
        timestampLabel: i.timestampLabel,
      },
    });
  }

  for (const c of CLAIMS) {
    await prisma.claim.upsert({
      where: {
        issueId_claimNumber: { issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID, claimNumber: c.claimNumber },
      },
      create: {
        id: c.id,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        claimNumber: c.claimNumber,
        status: c.status,
        text: c.text,
        notes: c.notes,
      },
      update: { status: c.status, text: c.text, notes: c.notes },
    });
    await syncClaimLinks(prisma, c.id, c.sourceIds, c.observationIds);
  }

  for (const group of stakeholderGroups) {
    const issueStakeholderId =
      group.id === STAKEHOLDER_GROUP_IDS.serviceUsers
        ? ISSUE_STAKEHOLDER_IDS.serviceUsers
        : group.id === STAKEHOLDER_GROUP_IDS.councillors
          ? ISSUE_STAKEHOLDER_IDS.councillors
          : ISSUE_STAKEHOLDER_IDS.staff;

    await prisma.issueStakeholder.upsert({
      where: {
        issueId_stakeholderGroupId: {
          issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
          stakeholderGroupId: group.id,
        },
      },
      create: {
        id: issueStakeholderId,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        stakeholderGroupId: group.id,
        priority: "Normal",
        needsToKnow: group.needsToKnow,
        issueRisk: "Process and message-discipline risk if lines over-claim or contradict the record.",
        channelGuidance: group.defaultChannels ?? "",
        toneAdjustment: group.defaultToneGuidance,
        notes: "Feasibility seed audience lens — dev/staging QA only.",
      },
      update: {
        needsToKnow: group.needsToKnow,
        issueRisk: "Process and message-discipline risk if lines over-claim or contradict the record.",
        channelGuidance: group.defaultChannels ?? "",
        toneAdjustment: group.defaultToneGuidance,
        notes: "Feasibility seed audience lens — dev/staging QA only.",
      },
    });
  }

  const activitySteps = [
    {
      kind: "issue_created",
      summary: "Issue created: Consultation on Proposed Changes to Service Opening Hours (feasibility seed)",
      refType: "Issue",
      refId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
    },
    {
      kind: "source_created",
      summary: "Source SRC-001 created (feasibility seed)",
      refType: "Source",
      refId: SOURCE_IDS.operations,
    },
    {
      kind: "internal_input_created",
      summary: "Internal observation created (feasibility seed)",
      refType: "InternalInput",
      refId: OBS_IDS.comms,
    },
    {
      kind: "gap_created",
      summary: "Open question recorded (feasibility seed)",
      refType: "Gap",
      refId: GAP_IDS.proposedHours,
    },
  ] as const;

  const base = new Date("2026-05-16T10:00:00.000Z");
  for (let idx = 0; idx < activitySteps.length; idx++) {
    const step = activitySteps[idx]!;
    const createdAt = new Date(base.getTime() + idx * 60 * 60 * 1000);
    await prisma.issueActivity.create({
      data: {
        id: ACTIVITY_IDS[idx]!,
        issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
        kind: step.kind,
        summary: step.summary,
        refType: step.refType,
        refId: step.refId,
        actorLabel: DEMO_ACTOR,
        createdAt,
      },
    });
    await prisma.issue.update({
      where: { id: FEASIBILITY_SERVICE_HOURS_ISSUE_ID },
      data: { lastActivityAt: createdAt },
    });
  }

  return {
    issueId: FEASIBILITY_SERVICE_HOURS_ISSUE_ID,
    sources: sources.length,
    observations: internalInputs.length,
    claims: CLAIMS.length,
    gaps: gaps.length,
    audienceGroups: stakeholderGroups.length,
  };
}
