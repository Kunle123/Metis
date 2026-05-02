/**
 * Lightweight deterministic checks for brief generation (no DB).
 * Run: `npm run test:brief-generate`
 */
import assert from "node:assert/strict";

import {
  generateBriefFromIssue,
  normalizeMessageAudienceGroupNames,
  splitOpenQuestionsToBullets,
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
assert.match(recBody, /\[[^\]]*\]\s*open question\s*\(/i);
assert.match(recBody, /tier mix/i);

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

console.log("generateBriefFromIssue fixtures: OK");
