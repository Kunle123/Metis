/**
 * Run: `npm run test:brief-narrative-sanitize`
 */
import assert from "node:assert/strict";

import {
  dedupeSentences,
  filterExecutiveNarrativeText,
  isExecutiveInternalMetadataLine,
  isNearDuplicateSentence,
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

console.log("executiveNarrativeSanitize.fixtures.runner: OK");
