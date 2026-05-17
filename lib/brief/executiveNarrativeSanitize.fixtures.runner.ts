/**
 * Run: `npm run test:brief-narrative-sanitize`
 */
import assert from "node:assert/strict";

import {
  dedupeExecutiveDoNotSayBullets,
  dedupeSentences,
  filterExecutiveNarrativeText,
  filterParagraphsNotInBody,
  formatExecutiveDoNotSayBullet,
  formatExecutiveDoNotSaySection,
  isExecutiveInternalMetadataLine,
  isNearDuplicateSentence,
  sanitizeExecutiveOwnerName,
} from "./executiveNarrativeSanitize";

assert.equal(isExecutiveInternalMetadataLine("This is a dev/staging feasibility seed."), true);
assert.equal(isExecutiveInternalMetadataLine("Options are under formal consultation."), false);

const filtered = filterExecutiveNarrativeText(
  "Feasibility QA record: internal only.\n\nMessage discipline: avoid implying a decision is made.",
);
assert.ok(!/feasibility qa record/i.test(filtered));
assert.match(filtered, /message discipline/i);

const deduped = dedupeSentences([
  "Staffing pressure and uneven usage patterns are among the drivers for reviewing the hours model.",
  "Staffing pressure and uneven usage patterns are part of the reason the opening-hours model is being reviewed.",
]);
assert.equal(deduped.length, 1);

assert.ok(
  isNearDuplicateSentence(
    "No final decision has been made.",
    "No final decision has been made on the proposed opening-hours change.",
  ),
);

assert.equal(sanitizeExecutiveOwnerName("Feasibility QA (dev seed)"), "Owner not assigned");
assert.equal(sanitizeExecutiveOwnerName("Casey Morgan"), "Casey Morgan");
assert.equal(
  formatExecutiveDoNotSayBullet("Do not say yet that the change will save money without reducing service quality."),
  "- That the change will save money without reducing service quality.",
);
assert.equal(
  formatExecutiveDoNotSayBullet("Do not say yet when the equality impact assessment will be complete."),
  "- When the equality impact assessment will be complete.",
);
const section = formatExecutiveDoNotSaySection([
  "Do not say yet that the change will save money without reducing service quality.",
]);
assert.ok(!/Do not say yet:\s*\n-\s*Do not say yet/i.test(section));

const dedupedGuardrails = dedupeExecutiveDoNotSayBullets([
  "Do not say yet when the equality impact assessment will be complete.",
  "when the equality impact assessment will be complete",
]);
assert.equal(dedupedGuardrails.length, 1);

const filteredSufficiency = filterParagraphsNotInBody(
  [
    "The current record supports an internal briefing on consultation process risk.",
    "External position remains provisional.",
  ],
  "The current record supports an internal briefing on consultation process risk.\n\nConsultation options are under review.",
);
assert.equal(filteredSufficiency.length, 1);
assert.match(filteredSufficiency[0]!, /External position remains provisional/i);

console.log("executiveNarrativeSanitize.fixtures.runner: OK");
