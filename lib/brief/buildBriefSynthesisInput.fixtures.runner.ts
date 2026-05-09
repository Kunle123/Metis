/**
 * Smoke: synthesis input shape matches brief-version generation expectations.
 * Run: `npm run test:brief-build-input`
 */
import assert from "node:assert/strict";
import type { Gap, InternalInput, Issue, Source } from "@prisma/client";

import { buildBriefSynthesisInput } from "./buildBriefSynthesisInput";

const baseIssue = {
  id: "i1",
  title: "Sample title",
  summary: "Summary line",
  context: "Ctx",
  confirmedFacts: "Fact A",
  openQuestions: "Q1\nQ2",
  audience: "Board",
} as unknown as Issue;

const out = buildBriefSynthesisInput({
  issue: baseIssue,
  sources: [] as Source[],
  gaps: [] as Gap[],
  internalInputs: [] as InternalInput[],
  deterministicExecutiveSummaryBody: "Deterministic exec paragraph.",
});

assert.equal(out.issue.title, "Sample title");
assert.equal(out.deterministicExecutiveSummaryBody, "Deterministic exec paragraph.");
assert.ok(Array.isArray(out.issue.openQuestionsIntake));
assert.ok(out.issue.openQuestionsIntake.length >= 2);
assert.ok(out.issue.audienceContextSummary.includes("Board"));

console.log("buildBriefSynthesisInput fixtures: ok");
