/**
 * Smoke: synthesis input shape matches brief-version generation expectations.
 * Run: `npm run test:brief-build-input`
 */
import assert from "node:assert/strict";
import type { Claim, Gap, InternalInput, Issue, Source } from "@prisma/client";

import { buildBriefSynthesisInput } from "./buildBriefSynthesisInput";

import { DEMO_ORGANISATION_ID } from "@/lib/organisations/demoOrganisation";

const baseIssue = {
  id: "i1",
  organisationId: DEMO_ORGANISATION_ID,
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
assert.equal(out.claims, undefined);

const demoClaim = {
  id: "claim-1",
  issueId: "i1",
  claimNumber: 3,
  text: "Pilot scope is provisional pending sign-off.",
  status: "NeedsValidation",
  notes: null,
  createdByUserId: null,
  updatedByUserId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as Claim;

const withClaims = buildBriefSynthesisInput({
  issue: baseIssue,
  sources: [] as Source[],
  gaps: [] as Gap[],
  internalInputs: [] as InternalInput[],
  claims: [demoClaim],
  deterministicExecutiveSummaryBody: "Deterministic exec paragraph.",
});
assert.ok(withClaims.claims);
assert.equal(withClaims.claims?.needsValidation?.[0]?.code, "CLM-003");

console.log("buildBriefSynthesisInput fixtures: ok");
