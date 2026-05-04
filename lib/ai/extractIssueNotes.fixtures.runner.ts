/**
 * Validates capture-notes extraction finalization without live OpenAI.
 * Run: `npm run test:capture-notes-extract`
 */
import assert from "node:assert/strict";

import type { CaptureNotesExtractResponse } from "@metis/shared/captureNotesExtract";

import {
  excerptAppearsInNotes,
  finalizeCaptureNotesExtraction,
  normalizeNotesForExcerptMatch,
} from "./extractIssueNotes";

const SAMPLE_NOTES = `
Team stand-up · 12 May — still unclear whether the outage was DNS or BGP.
Open: we need Finance to confirm capex envelope before announcing partnership.
Someone mentioned we should review the Slack thread abc-123 for the customer quote — not verified.
Question from comms: can we cite the March board pack externally? Unknown.
Maria said we might have an internal runbook somewhere but she was unsure.
Confirmed vs unclear: timelines are NOT agreed.
`.trim();

assert.ok(normalizeNotesForExcerptMatch(SAMPLE_NOTES).includes("dns"));
assert.ok(excerptAppearsInNotes("Open: we need Finance to confirm capex", SAMPLE_NOTES));

const mockedModelPayload = {
  suggestedOpenQuestions: [
    {
      title: "Capex envelope",
      prompt: "Has Finance confirmed the capex envelope before we announce?",
      whyItMatters: "Blocks external messaging on partnership.",
      stakeholder: "Finance lead",
      severity: "Important",
      linkedSection: null,
      verbatimExcerpt: "Open: we need Finance to confirm capex envelope before announcing partnership.",
      needsReview: true,
    },
  ],
  suggestedSources: [
    {
      title: "Slack thread",
      note: "Possible thread with customer quote",
      snippet: null,
      url: null,
      suggestedTier: "Internal",
      linkedSection: null,
      verbatimExcerpt: "Someone mentioned we should review the Slack thread abc-123 for the customer quote",
      isVerifiedEvidence: false,
      needsReview: true,
    },
    {
      title: "Official press page",
      note: "Mentioned outlet; tier should downgrade — excerpt is not explicitly official.",
      suggestedTier: "Official",
      linkedSection: null,
      verbatimExcerpt: "we might have an internal runbook somewhere",
      isVerifiedEvidence: false,
      needsReview: true,
    },
  ],
  suggestedObservations: [
    {
      role: "Meeting notes",
      name: "Maria",
      response: "Uncertain whether there is an internal runbook.",
      confidence: "Confirmed",
      linkedSection: null,
      verbatimExcerpt: "Maria said we might have an internal runbook somewhere but she was unsure.",
      needsReview: true,
    },
    {
      role: "Notes",
      name: "Session",
      response: "Root cause ambiguous between DNS and BGP.",
      confidence: "Unclear",
      linkedSection: null,
      verbatimExcerpt: "still unclear whether the outage was DNS or BGP.",
      needsReview: true,
    },
  ],
  followUpActions: [
    {
      label: "Clarify board pack citation rules",
      rationale: null,
      suggestedTarget: "open_question",
      verbatimExcerpt: "Question from comms: can we cite the March board pack externally?",
      needsReview: true,
    },
  ],
  limitations: "Several items deliberately uncertain in source notes.",
};

const finalized: CaptureNotesExtractResponse = finalizeCaptureNotesExtraction(mockedModelPayload, SAMPLE_NOTES);

assert.equal(finalized.ok, true);
assert.ok(finalized.suggestedOpenQuestions.length >= 1);
assert.ok(finalized.suggestedObservations.length >= 2);

const obsConfirmedStripped = finalized.suggestedObservations.find((o) => o.response.includes("runbook"));
assert.ok(obsConfirmedStripped, "expected observation retained");
assert.equal(
  obsConfirmedStripped?.confidence,
  "Needs validation",
  "Confirmed from model must not pass through untouched (not verified commentary)",
);

const officialDowngraded = finalized.suggestedSources.find((s) => s.title === "Official press page");
assert.ok(officialDowngraded?.suggestedTier === "Internal", "Official tier must downgrade when excerpt lacks explicit official wording");

/** Excerpt mismatch must drop suggestion */
const rejected = finalizeCaptureNotesExtraction(
  {
    suggestedSources: [
      {
        title: "Ghost source",
        note: "Made up excerpt",
        suggestedTier: "Internal",
        verbatimExcerpt: "this substring does not exist in notes at all xxx",
        isVerifiedEvidence: false,
        needsReview: true,
      },
    ],
    suggestedOpenQuestions: [],
    suggestedObservations: [],
    followUpActions: [],
    limitations: "",
  },
  SAMPLE_NOTES,
);
assert.deepEqual(rejected.suggestedSources, []);

/** Uncertainty preserved in payloads (verbatim excerpts + limitations) */
const blob = JSON.stringify(finalized).toLowerCase();
assert.ok(blob.includes("dns") || blob.includes("unclear"), "structured output retains uncertainty wording from notes");

console.log("extractIssueNotes fixtures: OK");
