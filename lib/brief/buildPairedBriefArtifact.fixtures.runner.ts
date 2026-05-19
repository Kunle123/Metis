/**
 * Run: npx tsx lib/brief/buildPairedBriefArtifact.fixtures.runner.ts
 */
import assert from "node:assert/strict";

import type { Issue } from "@prisma/client";

import { DEMO_ORGANISATION_ID } from "@/lib/organisations/demoOrganisation";

import { buildPairedBriefArtifact } from "./buildPairedBriefArtifact";
import { generateBriefFromIssue, type BriefGenerationInput } from "./generateBriefFromIssue";

const baseIssue: Issue = {
  id: "issue-paired",
  organisationId: DEMO_ORGANISATION_ID,
  title: "Paired brief sample",
  summary: "Summary for paired generation.",
  confirmedFacts: "- Fact one.",
  openQuestions: "",
  context: "Context paragraph.",
  issueType: "Operational",
  severity: "Moderate",
  status: "Active",
  priority: "Normal",
  operatorPosture: "Monitoring",
  ownerName: "Owner",
  audience: null,
  openGapsCount: 0,
  sourcesCount: 0,
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

const input: BriefGenerationInput = {
  issue: baseIssue,
  sources: [],
  gaps: [],
  internalInputs: [],
  claims: [],
  messageAudienceGroupNames: [],
};

const paired = buildPairedBriefArtifact(input);
const fullOnly = generateBriefFromIssue(input, "full");
const execOnly = generateBriefFromIssue(input, "executive");

assert.ok(paired.full.sections.length > 0, "paired artifact includes full sections");
assert.ok(paired.executive.blocks.length > 0, "paired artifact includes executive blocks");
assert.equal(
  paired.full.sections.find((s) => s.id === "executive-summary")?.body,
  fullOnly.full.sections.find((s) => s.id === "executive-summary")?.body,
  "full sections match full-mode generation",
);
assert.deepEqual(
  paired.executive.blocks.map((b) => b.label),
  execOnly.executive.blocks.map((b) => b.label),
  "executive blocks match executive-mode generation",
);
assert.ok(
  paired.executive.blocks.some((b) => b.label === "Executive summary"),
  "executive layout uses leadership labels",
);
assert.ok(
  !paired.executive.blocks.some((b) => b.label === "Situation"),
  "executive layout is not full-mode Situation block",
);

console.log("buildPairedBriefArtifact fixtures: OK");
