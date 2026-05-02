/**
 * Lightweight deterministic checks for brief generation (no DB).
 * Run: `npm run test:brief-generate`
 */
import assert from "node:assert/strict";

import { generateBriefFromIssue, splitOpenQuestionsToBullets, type BriefGenerationInput } from "./generateBriefFromIssue";
import type { Gap, InternalInput, Issue, IssueStakeholder, Source, StakeholderGroup } from "@prisma/client";

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
  issueStakeholders: [],
};

const execEmpty = generateBriefFromIssue(intakeOnly, "executive");
const execSituation = execEmpty.executive.blocks.find((b) => b.label === "Executive summary")?.body ?? "";
assert.match(execSituation, /Supplemental context|prior escalation/i);
assert.ok(!/^Title\s*:/m.test(execSituation), "executive Situation body should not repeat a Title line");

assert.equal(execEmpty.executive.immediateActions.length, 0, "immediate actions folded into recommendations / empty slice");

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

const stakeholderGroup: StakeholderGroup = {
  id: "sg-1",
  name: "Executives",
  description: null,
  defaultSensitivity: null,
  defaultChannels: null,
  defaultToneGuidance: null,
  displayOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const stakeholderRow: IssueStakeholder & { stakeholderGroup: StakeholderGroup } = {
  id: "is-1",
  issueId: "issue-1",
  stakeholderGroupId: stakeholderGroup.id,
  priority: "Normal",
  needsToKnow: "",
  issueRisk: "",
  channelGuidance: "",
  toneAdjustment: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stakeholderGroup,
};

const withStakeholders: BriefGenerationInput = { ...withGaps, issueStakeholders: [stakeholderRow] };
const execAudience = generateBriefFromIssue(withStakeholders, "executive");
const audBlock = execAudience.executive.blocks.find((b) => b.label === "Audience implications")?.body ?? "";
assert.match(audBlock, /Executives/);

console.log("generateBriefFromIssue fixtures: OK");
