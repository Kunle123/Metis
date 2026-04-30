/**
 * Lightweight fixture checks for message cleanup heuristics (no network).
 * Run: `npm run test:message-cleanup`
 */
import assert from "node:assert/strict";

import {
  joinedDeterministicContainsUncertaintySignals,
  polishedSatisfiesUncertaintyPreservation,
  rewriteIsTooMinorVsDeterministic,
} from "./cleanupMessageDraft";

function assertUncertaintyPreserved(det: string, pol: string) {
  assert.equal(
    polishedSatisfiesUncertaintyPreservation(det, pol),
    true,
    `expected polish to preserve uncertainty signals\ndet: ${det.slice(0, 120)}\npol: ${pol.slice(0, 120)}`,
  );
}

assert.equal(joinedDeterministicContainsUncertaintySignals("All facts are nailed down."), false);

assertUncertaintyPreserved(
  "Operational posture remains active. Vendor impact totals are still being confirmed with finance.",
  "We remain active operationally; finance has not yet confirmed vendor-impact totals.",
);

assertUncertaintyPreserved(
  "We have several open questions on regulatory sequencing.",
  "Regulatory sequencing still has open questions we are working through.",
);

const awkwardDet =
  "Our team is actively working on this matter (current status: Active). Posture: Active. No specific actions are recorded in the issue template yet.";
const polishedMeaningful =
  "We’re driving this forward with status flagged active internally. Nothing substantive is listed yet in the action register on the issue template.";
assert.equal(rewriteIsTooMinorVsDeterministic(awkwardDet, polishedMeaningful), false);

const identicalBody =
  "We are continuing to monitor the situation closely and will provide updates when something material changes.";
assert.equal(rewriteIsTooMinorVsDeterministic(identicalBody, identicalBody), true);

console.log("cleanupMessageDraft fixtures: OK");
