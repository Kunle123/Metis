/**
 * No-network guards for Brief executive-summary synthesis output.
 * Run: `npm run test:brief-synthesis`
 */
import assert from "node:assert/strict";

import { evaluateExecutivePolishedBodyForSave, isBriefExecutiveSummaryRewriteSafe, type BriefSynthesisInput } from "./synthesizeBrief";

const allowed = new Set(["2", "2024"]);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Open questions remain about the 2 incidents in 2024.",
    allowedNumbers: allowed,
    hasOpenQuestions: true,
  }),
  true,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Everything is now confirmed and closed.",
    allowedNumbers: allowed,
    hasOpenQuestions: true,
  }),
  false,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "A new figure of 999 residents is affected.",
    allowedNumbers: allowed,
    hasOpenQuestions: false,
  }),
  false,
);

assert.equal(
  isBriefExecutiveSummaryRewriteSafe({
    rewritten: "Status is subject to change while we coordinate with estates.",
    allowedNumbers: new Set(["3"]),
    hasOpenQuestions: true,
  }),
  true,
);

const saveInputStub: BriefSynthesisInput = {
  issue: {
    title: "T",
    summary: "S",
    context: "",
    confirmedFacts: "",
    openQuestionsIntake: ["What next?"],
    audienceContextSummary: "Note",
  },
  topTrackerOpenQuestions: [{ text: "Open gap", severity: null, linkedSection: null }],
  topSources: [],
  topObservations: [],
  deterministicExecutiveSummaryBody: "Open questions remain about the 2024 timetable; subject to change pending review.",
};

assert.equal(evaluateExecutivePolishedBodyForSave(saveInputStub, "").ok, false);
assert.equal(evaluateExecutivePolishedBodyForSave(saveInputStub, "Short").ok, false);
assert.deepEqual(evaluateExecutivePolishedBodyForSave(saveInputStub, "x".repeat(19)), {
  ok: false,
  message: "Polished wording is empty or too short to save.",
});
assert.equal(
  evaluateExecutivePolishedBodyForSave(
    saveInputStub,
    "Open questions remain; the 2024 timetable is not yet confirmed and remains subject to change.",
  ).ok,
  true,
);

const claimsOnlyNeedsValidationInput: BriefSynthesisInput = {
  issue: {
    title: "T",
    summary: "S",
    context: "",
    confirmedFacts: "",
    openQuestionsIntake: [],
    audienceContextSummary: "Note",
  },
  topTrackerOpenQuestions: [],
  topSources: [],
  topObservations: [],
  deterministicExecutiveSummaryBody:
    "The scope is provisional and subject to change while internal validation completes on the timetable.",
  claims: {
    confirmed: [],
    assumptions: [],
    needsValidation: [{ code: "CLM-004", text: "Still validating vendor scope.", notes: null }],
  },
};

assert.equal(
  evaluateExecutivePolishedBodyForSave(
    claimsOnlyNeedsValidationInput,
    "Vendor scope remains unconfirmed internally; timelines are provisional and subject to change.",
  ).ok,
  true,
);
assert.equal(
  evaluateExecutivePolishedBodyForSave(
    claimsOnlyNeedsValidationInput,
    "Vendor scope is now locked and timelines are definitive.",
  ).ok,
  false,
);

console.log("synthesizeBrief fixtures: ok");
