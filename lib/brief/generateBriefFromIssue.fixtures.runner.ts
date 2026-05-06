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
import type { Gap, InternalInput, Issue, Source } from "@prisma/client";

const baseIssue: Issue = {
  id: "issue-1",
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
  lastActivityAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function gap(o: Partial<Gap> & Pick<Gap, "prompt" | "title">): Gap {
  const now = new Date();
  return {
    id: o.id ?? "gap-1",
    issueId: o.issueId ?? "issue-1",
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
assert.match(execSituation, /Supplemental context|prior escalation/i);
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
assert.match(execEvWithGaps, /Full brief/i);

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
assert.ok(!/smoke test/i.test(evSmoke), "Executive evidence should not surface smoke-test titles");

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

console.log("generateBriefFromIssue fixtures: OK");
