/**
 * Lightweight deterministic checks for brief generation (no DB).
 * Run: `npm run test:brief-generate`
 */
import assert from "node:assert/strict";

import {
  buildExecutiveOpenQuestionsBody,
  generateBriefFromIssue,
  normalizeMessageAudienceGroupNames,
  splitOpenQuestionsToBullets,
  trimForExecutiveClause,
  type BriefGenerationInput,
} from "./generateBriefFromIssue";
import type { Claim, Gap, InternalInput, Issue, Source } from "@prisma/client";

import { DEMO_ORGANISATION_ID } from "@/lib/organisations/demoOrganisation";

/** Executive Evidence base block avoids internal jargon and keeps an audit trail pointer. */
function assertExecutiveEvidencePointerLanguage(which: string, body: string) {
  assert.ok(!/placeholder/i.test(body), `${which}: avoid placeholder wording in Executive evidence`);
  assert.ok(!/\bstub\b/i.test(body), `${which}: avoid stub wording in Executive evidence`);
  assert.ok(!/\bsmoke\b/i.test(body), `${which}: avoid smoke wording in Executive evidence`);
  assert.match(body, /complete source register/i, `${which}: should point reviewers to full register wording`);
  assert.match(body, /Sources page/i, `${which}: should cite Sources page`);
  assert.match(body, /Full brief/i, `${which}: should cite Full brief`);
}

const baseIssue: Issue = {
  id: "issue-1",
  organisationId: DEMO_ORGANISATION_ID,
  title: "Sample board brief",
  summary: "We are aligning on vendor impact before external lines.",
  confirmedFacts: null,
  openQuestions: "",
  context: "",
  issueType: "Operational",
  severity: "Moderate",
  status: "Active",
  priority: "Normal",
  operatorPosture: "Monitoring",
  ownerName: "Alex Rivera",
  audience: null,
  openGapsCount: 1,
  sourcesCount: 1,
  gapCodeSeq: 0,
  observationCodeSeq: 0,
  claimCodeSeq: 0,
  lastActivityAt: new Date(),
  archivedAt: null,
  archivedById: null,
  deletedAt: null,
  deletedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function gap(o: Partial<Gap> & Pick<Gap, "prompt" | "title">): Gap {
  const now = new Date();
  return {
    id: o.id ?? "gap-1",
    issueId: o.issueId ?? "issue-1",
    gapNumber: o.gapNumber ?? 1,
    title: o.title,
    prompt: o.prompt,
    whyItMatters: o.whyItMatters ?? "",
    stakeholder: o.stakeholder ?? "",
    linkedSection: o.linkedSection ?? null,
    severity: o.severity ?? "Important",
    status: o.status ?? "Open",
    resolvedByInternalInputId: o.resolvedByInternalInputId ?? null,
    createdAt: o.createdAt ?? now,
    updatedAt: o.updatedAt ?? now,
  };
}

const sampleGap = gap({
  prompt: "Confirm whether phased rollout stays within procurement rules.",
  title: "Procurement sequencing",
  linkedSection: "Procurement",
  severity: "Critical",
});

const sampleSource: Source = {
  id: "src-1",
  issueId: "issue-1",
  sourceCode: "SRC-001",
  tier: "Internal",
  title: "Finance readiness note",
  note: null,
  snippet: null,
  reliability: "Medium",
  linkedSection: "Finance",
  url: null,
  timestampLabel: null,
  createdAt: new Date(),
};

/** Single long paragraph → multiple bullets via sentence splits (deterministic). */
const longParagraphQuestions =
  "What is our fallback if finance delays sign-off next week. Which owners need to brief the regulator. Can we cite the draft memo externally.";

const bullets = splitOpenQuestionsToBullets(longParagraphQuestions);
assert.ok(bullets.length >= 2, "expected single-paragraph intake to split conservatively");

const intakeOnly: BriefGenerationInput = {
  issue: { ...baseIssue, openQuestions: longParagraphQuestions, context: "Prior escalation on vendor stability." },
  sources: [],
  gaps: [],
  internalInputs: [] as InternalInput[],
};

const execEmpty = generateBriefFromIssue(intakeOnly, "executive");
const execSituation = execEmpty.executive.blocks.find((b) => b.label === "Executive summary")?.body ?? "";
assert.match(execSituation, /supports an internal briefing/i);
assert.match(execSituation, /Immediate leadership decisions/i);
assert.ok(!/^Title\s*:/m.test(execSituation), "executive Situation body should not repeat a Title line");

assert.equal(execEmpty.executive.immediateActions.length, 0, "immediate actions folded into recommendations / empty slice");

const audienceThin = execEmpty.executive.blocks.find((b) => b.label === "Audience implications")?.body ?? "";
assert.match(
  audienceThin,
  /No organisation audience groups appear in saved Messages/i,
  "thin-data audience copy when no Messages groups and no intake audience",
);

const withGaps: BriefGenerationInput = {
  issue: baseIssue,
  sources: [sampleSource],
  gaps: [sampleGap],
  internalInputs: [] as InternalInput[],
};

const execGaps = generateBriefFromIssue(withGaps, "executive");
const recBody = execGaps.executive.blocks.find((b) => b.label === "Recommended decisions / next actions")?.body ?? "";
assert.match(recBody, /Agree procurement and approval sequencing/i);
assert.ok(
  !/Assign owner and resolution path/i.test(recBody),
  "Executive recommendations should be decision-framed, not repetitive tracker owner assignment",
);

const execEvWithGaps = execGaps.executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assert.ok(!execEvWithGaps.includes("SRC-"), "Executive evidence summary should not expose source codes");
assert.ok(!execEvWithGaps.toLowerCase().includes("reliability not set"), 'Executive evidence should not surface "reliability not set"');
assertExecutiveEvidencePointerLanguage("exec evidence with gaps", execEvWithGaps);

/** Intake `issue.audience` fallback when Messages has no audience groups recorded. */
const intakeAudienceOnly: BriefGenerationInput = {
  ...withGaps,
  issue: { ...baseIssue, audience: "Board and programme leads only.", openGapsCount: baseIssue.openGapsCount },
};
const execIntakeAudience = generateBriefFromIssue(intakeAudienceOnly, "executive");
const audienceIntakeOnly = execIntakeAudience.executive.blocks.find((b) => b.label === "Audience implications")?.body ?? "";
assert.match(audienceIntakeOnly, /Issue-level audience note \(intake\)/);
assert.match(audienceIntakeOnly, /Board and programme leads only/);

const withMessageAudience: BriefGenerationInput = {
  ...withGaps,
  messageAudienceGroupNames: ["Executives", "Community", "Executives"],
};
const normalized = normalizeMessageAudienceGroupNames(["Executives", "Community", "Executives"]);
assert.deepEqual(normalized, ["Community", "Executives"]);

const execAudience = generateBriefFromIssue(withMessageAudience, "executive");
const audBlock = execAudience.executive.blocks.find((b) => b.label === "Audience implications")?.body ?? "";
assert.match(audBlock, /Audience groups used in Messages/);
assert.match(audBlock, /Community/);
assert.match(audBlock, /Executives/);
assert.ok(
  audBlock.indexOf("Community") < audBlock.indexOf("Executives"),
  "audience names should appear in deterministic sort order",
);

const execRecWithMessages = execAudience.executive.blocks.find((b) => b.label === "Recommended decisions / next actions")?.body ?? "";
assert.match(execRecWithMessages, /audience groups used in Messages/i);
assert.match(execRecWithMessages, /Community/);
const stressMsgLine =
  execRecWithMessages.split("\n").find((line) => /Stress-test external-facing/i.test(line)) ??
  execRecWithMessages.split("\n").find((line) => /Messages/i.test(line)) ??
  "";
assert.match(
  stressMsgLine,
  /Messages \(Community, Executives\)\./,
  "parenthetical around Messages audience lists must close before the sentence period",
);

/** Both Messages groups and intake note. */
const combined: BriefGenerationInput = {
  ...withMessageAudience,
  issue: { ...baseIssue, audience: "Internal circulation only.", openGapsCount: baseIssue.openGapsCount },
};
const execCombined = generateBriefFromIssue(combined, "executive");
const audCombined = execCombined.executive.blocks.find((b) => b.label === "Audience implications")?.body ?? "";
assert.match(audCombined, /Audience groups used in Messages:/);
assert.match(audCombined, /Issue-level audience note \(intake\):/);
assert.match(audCombined, /Internal circulation only/);

const officialFirst: Source = {
  ...sampleSource,
  id: "src-off",
  sourceCode: "SRC-OFF",
  title: "Official line",
  tier: "Official",
  createdAt: new Date("2020-01-01T00:00:00.000Z"),
};
const internalNewer: Source = {
  ...sampleSource,
  id: "src-in",
  sourceCode: "SRC-IN",
  title: "Internal note",
  tier: "Internal",
  createdAt: new Date("2025-06-01T00:00:00.000Z"),
};

const execEvReliabilityTwo = generateBriefFromIssue(
  {
    issue: baseIssue,
    sources: [
      { ...officialFirst, id: "rel-a", sourceCode: "SC-REL-A", title: "Published line", reliability: null },
      { ...internalNewer, id: "rel-b", sourceCode: "SC-REL-B", title: "Working note", reliability: null },
      { ...sampleSource, id: "rel-c", sourceCode: "SC-REL-C", tier: "Major media", title: "Local coverage", reliability: "Low" },
      { ...sampleSource, id: "rel-d", sourceCode: "SC-REL-D", tier: "Internal", title: "Workstream note", reliability: "High" },
      { ...sampleSource, id: "rel-e", sourceCode: "SC-REL-E", tier: "Official", title: "Published FAQ", reliability: "Medium" },
    ],
    gaps: [],
    internalInputs: [] as InternalInput[],
  },
  "executive",
).executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assert.match(execEvReliabilityTwo, /\. Two linked .* lack/i, "sentence after a period should capitalise the spelled-out count");
assert.match(execEvReliabilityTwo, /major-tier (media or broadcast|third-party)/i);
assert.ok(!/Major media record/i.test(execEvReliabilityTwo), "avoid raw Major/media tier concatenations in prose");
assertExecutiveEvidencePointerLanguage("exec evidence reliability mix", execEvReliabilityTwo);

const tierOrderExec = generateBriefFromIssue(
  { issue: baseIssue, sources: [internalNewer, officialFirst], gaps: [], internalInputs: [] as InternalInput[] },
  "executive",
);
const evBody = tierOrderExec.executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assert.match(evBody, /^The evidence base is/m);
assert.ok(!/linked record\(s\)/i.test(evBody), "Executive evidence should read in natural prose, not system-style tallies");
assert.match(evBody, /official or public-facing/i);
assert.match(evBody, /internal/i);
assert.ok(!evBody.includes("SRC-"), "Executive evidence stays free of SRC codes despite ranked ordering");
assertExecutiveEvidencePointerLanguage("exec evidence tier ordering", evBody);

/** Full artifact evidence panel retains per-source SRC listing for auditability. */
const fullTierEvidence = generateBriefFromIssue(
  { issue: baseIssue, sources: [internalNewer, officialFirst], gaps: [], internalInputs: [] as InternalInput[] },
  "full",
);
const fullEvPanel = fullTierEvidence.executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assert.ok(fullEvPanel.includes("SRC-OFF"), "Full brief keeps detailed source identifiers");

const mergedExecBody = buildExecutiveOpenQuestionsBody(
  "Define the material change threshold for external communications rollout.",
  [
    gap({
      id: "gap-material",
      prompt: "Confirm the material-change threshold for external communications rollout.",
      title: "Materiality",
      severity: "Critical",
    }),
  ],
  5,
);
const mergedBullets = mergedExecBody.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-"));
assert.ok(mergedBullets.length === 1, "Executive open-question merge should collapse near-duplicate wording");

const smokeSource: Source = {
  ...sampleSource,
  id: "smoke-1",
  sourceCode: "SRC-SMOKE",
  title: "Smoke test harness",
};
const execSmoke = generateBriefFromIssue(
  { issue: baseIssue, sources: [smokeSource, sampleSource], gaps: [], internalInputs: [] as InternalInput[] },
  "executive",
);
const evSmoke = execSmoke.executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assert.ok(!evSmoke.includes("SRC-SMOKE"));
assertExecutiveEvidencePointerLanguage("exec evidence with mixed non-summarised links", evSmoke);

const execNoSubstantiveSummary = generateBriefFromIssue(
  { issue: baseIssue, sources: [smokeSource], gaps: [], internalInputs: [] as InternalInput[] },
  "executive",
).executive.blocks.find((b) => b.label === "Evidence base")?.body ?? "";
assertExecutiveEvidencePointerLanguage("exec evidence without summarised substantive rows", execNoSubstantiveSummary);

const clipped = trimForExecutiveClause(
  "Phase funding across operating envelopes (budget/planning/safety and environment teams) so each gate lines up with consultations",
  72,
);
assert.ok(!/\([^)]*$/.test(clipped.trim()), "Executive trimming should not leave an unclosed parenthetical");
assert.match(clipped, /…$/);

const consultationLegal: BriefGenerationInput = {
  issue: {
    ...baseIssue,
    title: "Harbourway redevelopment consultation",
    summary: "Structured consultation on options before the next resident workshop.",
    context: "Clarify what is open versus fixed before external lines harden.",
  },
  sources: [],
  gaps: [
    gap({
      id: "g-legal",
      severity: "Important",
      linkedSection: "Legal",
      prompt: "Has legal confirmed whether customer notices are required prior to public statements.",
      title: "Notice check",
    }),
    gap({
      id: "g-material",
      severity: "Critical",
      linkedSection: "Programme",
      prompt: "Confirm the material-change threshold after consultation feedback is incorporated.",
      title: "Material changes",
    }),
  ],
  internalInputs: [] as InternalInput[],
};
const execConsult = generateBriefFromIssue(consultationLegal, "executive");
const recConsult = execConsult.executive.blocks.find((b) => b.label === "Recommended decisions / next actions")?.body ?? "";
assert.match(recConsult, /notice obligations apply/i);
assert.match(recConsult, /sign-off route for material changes driven by consultation feedback/i);
const openConsult = execConsult.executive.blocks.find((b) => b.label === "Open questions and unresolved needs")?.body ?? "";
assert.match(openConsult, /legal notice question is applicable/i);

const longParenGap = gap({
  id: "gap-paren",
  severity: "Important",
  prompt:
    "Phase funding across operating envelopes (budget/planning/safety and environment teams) so each consultation gate stays aligned with statutory checkpoints and sign-off windows.",
  title: "Funding envelope",
});
const execParenStress = generateBriefFromIssue(
  { issue: baseIssue, sources: [], gaps: [longParenGap], internalInputs: [] as InternalInput[] },
  "executive",
);
const assertNoDanglingOpenParen = (label: string, text: string) => {
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("-")) continue;
    assert.ok(!/\([^)]*$/.test(line), `${label} should not end a bullet with an unclosed parenthetical`);
  }
};
assertNoDanglingOpenParen("Open questions", execParenStress.executive.blocks.find((b) => b.label === "Open questions and unresolved needs")?.body ?? "");
assertNoDanglingOpenParen("Recommendations", execParenStress.executive.blocks.find((b) => b.label === "Recommended decisions / next actions")?.body ?? "");

const fullKeyUnknowns = fullTierEvidence.executive.blocks.find((b) => b.label === "Key unknowns / open questions")?.body ?? "";
assert.match(fullKeyUnknowns, /Key unknowns|open questions|No open questions/i);

/** Intake + tracker duplicate (near-identical wording) — Full brief summary should list once. */
const thresholdText =
  "What is the internal threshold for material change driven by feedback, and who signs it off?";
const fullDedup = generateBriefFromIssue(
  {
    issue: { ...baseIssue, openQuestions: thresholdText, openGapsCount: 3 },
    sources: [],
    gaps: [
      gap({
        id: "gap-thresh",
        prompt: thresholdText,
        title: "Threshold",
        severity: "Important",
        linkedSection: "Programme",
      }),
    ],
    internalInputs: [] as InternalInput[],
  },
  "full",
);
const confirmedVs = fullDedup.full.sections.find((s) => s.id === "confirmed-vs-unclear")?.body ?? "";
const threshHits = [...confirmedVs.matchAll(/internal threshold for material change/gi)];
assert.ok(threshHits.length <= 1, "Open questions (summary) should not repeat the same near-duplicate line");
assert.match(confirmedVs, /## Open questions \(summary\)/);

function sampleClaim(p: Partial<Claim> & Pick<Claim, "claimNumber" | "text" | "status">): Claim {
  const now = new Date();
  return {
    id: p.id ?? `claim-${p.claimNumber}`,
    issueId: p.issueId ?? "issue-1",
    claimNumber: p.claimNumber,
    text: p.text,
    status: p.status,
    notes: p.notes ?? null,
    createdByUserId: null,
    updatedByUserId: null,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

const withClaims: BriefGenerationInput = {
  issue: baseIssue,
  sources: [],
  gaps: [],
  internalInputs: [] as InternalInput[],
  claims: [
    sampleClaim({ claimNumber: 1, text: "Budget is fixed for this phase.", status: "Confirmed" }),
    sampleClaim({ claimNumber: 2, text: "Uptake skews weekend.", status: "Assumption" }),
    sampleClaim({ claimNumber: 3, text: "Equality sign-off pending.", status: "NeedsValidation" }),
    sampleClaim({ claimNumber: 4, text: "Old scope line.", status: "Superseded" }),
  ],
};

const execClaims = generateBriefFromIssue(withClaims, "executive");
const execConfirmedOnly = execClaims.executive.blocks.find((b) => b.label === "Confirmed facts")?.body ?? "";
assert.ok(
  !execConfirmedOnly.includes("CLM-"),
  "Confirmed facts block must list intake facts only — claims live under Claims and assumptions",
);
const execClaimsBlock = execClaims.executive.blocks.find((b) => b.label === "Claims and assumptions")?.body ?? "";
assert.match(execClaimsBlock, /Claims position: 1 confirmed · 1 assumption · 1 need validation · 1 superseded/);
assert.match(execClaimsBlock, /### Confirmed claims/);
assert.match(execClaimsBlock, /CLM-001/);
assert.match(execClaimsBlock, /### Assumptions — phrase conditionally/);
assert.match(execClaimsBlock, /CLM-002/);
assert.match(execClaimsBlock, /### Needs validation — do not state as fact/);
assert.match(execClaimsBlock, /CLM-003/);
assert.ok(!execClaimsBlock.includes("CLM-004"), "superseded claim should not appear in briefing context");

const execNoClaims = generateBriefFromIssue(intakeOnly, "executive");
assert.ok(
  !execNoClaims.executive.blocks.some((b) => b.label === "Claims and assumptions"),
  "omit Claims section when register is empty",
);

function internalInputRow(p: Partial<InternalInput> & Pick<InternalInput, "response" | "name" | "role">): InternalInput {
  const now = new Date();
  return {
    id: p.id ?? "obs-1",
    issueId: p.issueId ?? "issue-1",
    observationNumber: p.observationNumber ?? 1,
    role: p.role,
    name: p.name,
    response: p.response,
    confidence: p.confidence ?? "Medium",
    excludedFromBrief: p.excludedFromBrief ?? false,
    linkedSection: p.linkedSection ?? null,
    visibility: p.visibility ?? "Organisation",
    createdByUserId: p.createdByUserId ?? null,
    timestampLabel: p.timestampLabel ?? null,
    createdAt: p.createdAt ?? now,
  };
}

const excludedOnlyObs: BriefGenerationInput = {
  issue: baseIssue,
  sources: [],
  gaps: [],
  internalInputs: [
    internalInputRow({
      id: "obs-ex",
      response: "Sensitive operator note.",
      name: "Ops",
      role: "Operator",
      excludedFromBrief: true,
    }),
  ],
};
const execExcludedObs = generateBriefFromIssue(excludedOnlyObs, "executive");
const obsExcludedBody =
  execExcludedObs.executive.blocks.find((b) => b.label === "Observations")?.body ?? "";
assert.match(
  obsExcludedBody,
  /No internal observations are included in this brief\. 1 observation exists but is excluded from brief output\./,
);

const includedPlusExcluded: BriefGenerationInput = {
  ...excludedOnlyObs,
  internalInputs: [
    internalInputRow({
      id: "obs-in",
      observationNumber: 1,
      response: "Included note for the brief.",
      name: "Comms",
      role: "Comms lead",
      excludedFromBrief: false,
    }),
    internalInputRow({
      id: "obs-ex2",
      observationNumber: 2,
      response: "Excluded sensitive line.",
      name: "Ops",
      role: "Operator",
      excludedFromBrief: true,
    }),
  ],
};
const execMixedObs = generateBriefFromIssue(includedPlusExcluded, "executive").executive.blocks.find(
  (b) => b.label === "Observations",
)?.body ?? "";
assert.match(execMixedObs, /Key themes:/i);
assert.match(execMixedObs, /context, not confirmed fact/i);
assert.match(execMixedObs, /1 observation is excluded from brief output\./);

const fullClaims = generateBriefFromIssue(withClaims, "full");
const confirmedVsWithClaims = fullClaims.full.sections.find((s) => s.id === "confirmed-vs-unclear")?.body ?? "";
assert.match(confirmedVsWithClaims, /## Claims and assumptions/);
assert.match(confirmedVsWithClaims, /## Confirmed facts/);
assert.ok(!confirmedVsWithClaims.includes("Claims register"), "prefer Claims and assumptions heading");

const wrongIssueClaim = sampleClaim({
  id: "foreign",
  issueId: "some-other-issue",
  claimNumber: 9,
  text: "Belongs to another issue row in DB — generator trusts caller filtering.",
  status: "Confirmed",
});
const execForeign = generateBriefFromIssue({ ...withClaims, claims: [wrongIssueClaim] }, "executive");
assert.ok(
  execForeign.executive.blocks.find((b) => b.label === "Claims and assumptions")?.body.includes("Belongs to another issue"),
  "generateBriefFromIssue does not filter by claim.issueId — API/loaders must scope rows",
);

const consultationHoursIssue = {
  ...baseIssue,
  title: "Consultation on Proposed Changes to Service Opening Hours",
  summary: "Consultation on opening hours; message discipline required.",
  status: "Ready to brief",
  context: "Avoid implying a decision is made before equality assessment is complete.",
  openQuestions: "",
  openGapsCount: 2,
};
const consultationGaps = [
  gap({
    id: "g-hours",
    severity: "Critical",
    prompt: "What precise opening-hours option is being proposed for consultation?",
    title: "Proposed hours",
    stakeholder: "Operations",
  }),
  gap({
    id: "g-eq",
    severity: "Important",
    prompt: "When will the equality impact assessment be available?",
    title: "Equality timing",
    stakeholder: "Policy",
  }),
];
const consultationClaims = [
  sampleClaim({ claimNumber: 1, text: "Consultation options are under review.", status: "Confirmed" }),
  sampleClaim({ claimNumber: 2, text: "No final decision has been made.", status: "Confirmed" }),
  sampleClaim({ claimNumber: 3, text: "A late-evening slot may offset weekday access.", status: "Assumption" }),
  sampleClaim({ claimNumber: 4, text: "The change will save money without reducing service quality.", status: "NeedsValidation" }),
  sampleClaim({ claimNumber: 5, text: "Older residents will not be adversely affected.", status: "NeedsValidation" }),
  sampleClaim({ claimNumber: 6, text: "The service will close earlier from next month.", status: "Superseded" }),
];
const execConsultHours = generateBriefFromIssue(
  {
    issue: consultationHoursIssue,
    sources: [],
    gaps: consultationGaps,
    internalInputs: [] as InternalInput[],
    claims: consultationClaims,
  },
  "executive",
);
const execSummaryHours =
  execConsultHours.executive.blocks.find((b) => b.label === "Executive summary")?.body ?? "";
assert.match(execSummaryHours, /supports an internal briefing on consultation process risk/i);
assert.match(execSummaryHours, /does not yet support.*exact hours/i);
const sufficiency = execConsultHours.executive.blocks.find((b) => b.label === "Record sufficiency")?.body ?? "";
assert.match(sufficiency, /External position remains provisional/i);
assert.ok(!/supports an internal briefing on consultation process risk/i.test(sufficiency));
const assessment = execConsultHours.executive.blocks.find((b) => b.label === "Current assessment")?.body ?? "";
assert.match(assessment, /Ready for internal briefing with caveats/i);
assert.match(assessment, /Briefing confidence: Provisional/i);
const recHours = execConsultHours.executive.blocks.find((b) => b.label === "Recommended decisions / next actions")?.body ?? "";
assert.match(recHours, /proposed opening-hours option before any external line/i);
assert.ok(!/leadership position regarding \(Planning\)/i.test(recHours));
const guardExec = execConsultHours.executive.blocks.find((b) => b.label === "What not to say yet / uncertainty guardrails")?.body ?? "";
assert.match(guardExec, /Do not say yet:/i);
assert.match(guardExec, /final opening hours/i);
assert.match(guardExec, /closing early/i);
assert.ok(!/Do not say yet:\s*\n-\s*Do not say yet/i.test(guardExec), "guardrail bullets must not repeat the section lead-in");

const feasibilitySeedIssue = {
  ...consultationHoursIssue,
  ownerName: "Feasibility QA (dev seed)",
  summary:
    "Feasibility QA record: a live-style comms issue on proposed service opening-hours consultation. The record mixes operational updates — intended to test whether Metis can produce a valuable executive brief without over-claiming.",
  context: [
    "This is a dev/staging feasibility seed — not production content and not a public demo route.",
    "Message discipline: avoid implying a decision is made before equality assessment is complete.",
  ].join("\n\n"),
  confirmedFacts: [
    "Consultation options for service opening hours are under review.",
    "No final decision has been made on the proposed opening-hours change.",
    "Staffing pressure and uneven usage patterns are among the drivers for reviewing the hours model.",
    "Public social claims about imminent early closure are inaccurate based on the current record.",
  ].join("\n"),
};
const feasibilityClaims = [
  ...consultationClaims,
  sampleClaim({
    claimNumber: 9,
    text: "Staffing pressure and uneven usage patterns are part of the reason the opening-hours model is being reviewed.",
    status: "Confirmed",
  }),
];
const feasibilityObservations: InternalInput[] = [
  internalInputRow({
    role: "Comms",
    name: "Amara Lewis",
    response:
      "We need to avoid language that implies the decision is already made. Options are under review.",
    linkedSection: "Message discipline",
  }),
  internalInputRow({
    role: "Operations",
    name: "Daniel Price",
    response:
      "Staffing pressure is driving the hours review. The equality assessment is not complete.",
    linkedSection: "Operations",
  }),
  internalInputRow({
    role: "Policy",
    name: "Priya Raman",
    response: "The equality impact assessment is not complete.",
    linkedSection: "Equality",
  }),
  internalInputRow({
    role: "Customer team",
    name: "Ben Carter",
    response: "People are asking for exact proposed hours but staff do not have a signed-off option.",
    linkedSection: "Front desk",
  }),
  internalInputRow({
    role: "Executive office",
    name: "Marcus Hale",
    response: "The chief executive wants a short line for councillors by tomorrow morning.",
    linkedSection: "Leadership",
  }),
];
const execFeasibility = generateBriefFromIssue(
  {
    issue: feasibilitySeedIssue,
    sources: [],
    gaps: consultationGaps,
    internalInputs: feasibilityObservations,
    claims: feasibilityClaims,
  },
  "executive",
);
const feasibilityBody = [
  execFeasibility.lede,
  ...execFeasibility.executive.blocks.map((b) => b.body),
].join("\n");
const forbiddenSeed = [
  /Feasibility QA/i,
  /dev seed/i,
  /dev\/staging/i,
  /feasibility seed/i,
  /not production content/i,
  /not a public demo route/i,
  /intended to test whether Metis/i,
  /live-style comms issue/i,
  /\b44444444-/i,
];
for (const re of forbiddenSeed) {
  assert.ok(!re.test(feasibilityBody), `executive brief must not contain seed/dev metadata: ${re}`);
}
assert.match(feasibilityBody, /Ready for internal briefing with caveats/i);
assert.match(feasibilityBody, /External position: Remains provisional/i);
assert.match(feasibilityBody, /external position remains provisional/i);
assert.match(feasibilityBody, /supports an internal briefing on consultation process risk/i);
const assessmentFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "Current assessment")?.body ?? "";
assert.ok(!/Feasibility QA/i.test(assessmentFeasibility));
assert.ok(!/dev seed/i.test(assessmentFeasibility));
assert.match(assessmentFeasibility, /Issue owner: not recorded yet|Issue owner: Owner not assigned/i);
const guardFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "What not to say yet / uncertainty guardrails")?.body ?? "";
assert.ok(!/Do not say yet:\s*\n-\s*Do not say yet/i.test(guardFeasibility));
assert.match(guardFeasibility, /save money without reducing service quality/i);
assert.match(guardFeasibility, /equality impact assessment will be complete/i);
assert.match(guardFeasibility, /closing early/i);
const execSummaryFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "Executive summary")?.body ?? "";
assert.match(
  execSummaryFeasibility,
  /^The current record supports an internal briefing/s,
  "executive summary must lead with record sufficiency judgement",
);
assert.ok(!/^Message discipline:/m.test(execSummaryFeasibility.trim().split("\n")[0] ?? ""));
const confirmedFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "Confirmed facts")?.body ?? "";
const staffingHits = confirmedFeasibility.match(/staffing pressure/gi) ?? [];
assert.ok(staffingHits.length <= 1, "confirmed facts block must not repeat staffing pressure line");
const claimsFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "Claims and assumptions")?.body ?? "";
assert.ok(
  !/staffing pressure and uneven usage patterns are part of the reason/i.test(claimsFeasibility),
  "confirmed claims duplicated in intake should not repeat in claims register detail",
);

const sufficiencyFeasibility =
  execFeasibility.executive.blocks.find((b) => b.label === "Record sufficiency")?.body ?? "";
const sufficiencyLead =
  "The current record supports an internal briefing on consultation process risk and message discipline";
assert.match(execSummaryFeasibility, /supports an internal briefing on consultation process risk/i);
assert.ok(
  !sufficiencyFeasibility.includes(sufficiencyLead),
  "record sufficiency block must not repeat the executive summary lead paragraph verbatim",
);
if (sufficiencyFeasibility.trim()) {
  assert.match(sufficiencyFeasibility, /External position remains provisional/i);
}

const equalityGuardrailHits =
  guardFeasibility.match(/equality impact assessment will be complete/gi) ?? [];
assert.equal(
  equalityGuardrailHits.length,
  1,
  "Do not say yet must list the equality timing guardrail only once",
);

const obsFeasibility = execFeasibility.executive.blocks.find((b) => b.label === "Observations")?.body ?? "";
assert.match(obsFeasibility, /Key themes:/i);
assert.match(obsFeasibility, /context, not confirmed fact/i);
assert.ok(!/^-\s/m.test(obsFeasibility), "executive observations should be thematic, not a bullet dump");
assert.ok(obsFeasibility.split(/\n\n/).length <= 4, "executive observations should stay compact");

const execSummaryParas = execSummaryFeasibility.split(/\n\n+/).filter(Boolean);
assert.ok(execSummaryParas.length <= 3, "executive summary should be at most three paragraphs");

console.log("generateBriefFromIssue fixtures: OK");
