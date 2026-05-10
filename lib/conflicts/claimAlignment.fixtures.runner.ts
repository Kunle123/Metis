/**
 * Coverage for deterministic claim-vs-draft heuristic review.
 * Run: `npm run test:claim-alignment`
 */
import assert from "node:assert/strict";

import type {
  ClaimAlignmentClaimInput,
  ClaimAlignmentFinding,
  ClaimAlignmentFindingType,
} from "./claimAlignment";
import { evaluateClaimAlignmentForText } from "./claimAlignment";

const baseDraft =
  "# Update\n\n" +
  "## What happened\nPublic update text goes here.\n\n" +
  "## More\nAdditional detail filler so heuristics activate across enough surface area.\n\n";

/** Keep total comparable length comfortably above heuristic minimum. */
function padDraft(body: string) {
  const filler =
    Lorem.repeat(40) +
    " Service recovery remains the priority." +
    " Use official channels rather than speculative summaries circulated informally.";
  return `${body}\n\n${filler}`;
}

const Lorem =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore. ";

function hasType(findings: ClaimAlignmentFinding[], type: ClaimAlignmentFindingType, claimCode: string) {
  return findings.some((f) => f.type === type && f.claimCode === claimCode);
}

const CONFIRMED: ClaimAlignmentClaimInput = {
  id: "c1",
  claimCode: "CLM-001",
  text: "The maintenance window concludes at 06:00 and customer traffic resumes normally.",
  status: "Confirmed",
  notes: null,
};

const ASSUMPTION: ClaimAlignmentClaimInput = {
  id: "c2",
  claimCode: "CLM-002",
  text: "Third-party failover routing is absorbing the degraded region until primary capacity returns.",
  status: "Assumption",
  notes: null,
};

const NEEDS_VALIDATION: ClaimAlignmentClaimInput = {
  id: "c3",
  claimCode: "CLM-003",
  text: "No regulated personal data crossed the sandbox boundary during the incident window.",
  status: "NeedsValidation",
  notes: null,
};

const SUPERSEDED: ClaimAlignmentClaimInput = {
  id: "c4",
  claimCode: "CLM-004",
  text: "All storefront checkout flows were restored before the retail peak window.",
  status: "Superseded",
  notes: null,
};

const REGISTER = [CONFIRMED, ASSUMPTION, NEEDS_VALIDATION, SUPERSEDED];

/** Superseded body echo */
{
  const txt = padDraft(`## Narrative\nWe believe ${SUPERSEDED.text}\nCustomers should retry checkout now.`);
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.ok(f.some((x) => x.type === "superseded_claim_referenced" && x.claimCode === "CLM-004"), "expects superseded echo");
}

/** Explicit CLM superseded citation */
{
  const txt = padDraft(`Operational note referencing ${SUPERSEDED.claimCode} explicitly in saved draft wording.`);
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.ok(f.some((x) => x.type === "superseded_claim_referenced" && x.severity === "critical"), "code cite superseded critical");
}

/** Assumption echoed with caveat */
{
  const txt = padDraft(
    `Incident summary: Third-party failover routing may still be absorbing the degraded region until primary capacity returns; teams are monitoring.`,
  );
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.equal(hasType(f, "assumption_stated_as_fact", "CLM-002"), false, "hedged assumption should not flag firmly");
}

/** Assumption echoed as authoritative */
{
  const txt = padDraft(`${ASSUMPTION.text}`);
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.ok(hasType(f, "assumption_stated_as_fact", "CLM-002"));
}

/** Needs validation plainly stated */
{
  const txt = padDraft(`${NEEDS_VALIDATION.text}`);
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.ok(hasType(f, "needs_validation_stated_as_fact", "CLM-003"));
}

/** Confirmed claim echoed without caveat — expect no prohibition */
{
  const txt = padDraft(CONFIRMED.text);
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.equal(f.filter((x) => x.claimCode === "CLM-001").length, 0, "pure confirmed echo clears review");
}

/** Negated Confirmed ⇒ possible conflict */
{
  const txt = padDraft(
    `${CONFIRMED.text.slice(0, -1)}, however responders now recognise the maintenance window is not concluding at 06:00 as planned.`,
  );
  const f = evaluateClaimAlignmentForText(txt, REGISTER);
  assert.ok(
    f.some((x) => x.type === "possible_confirmed_claim_conflict" && x.claimCode === "CLM-001"),
    "negation heuristic against confirmed",
  );
}

console.log("claimAlignment.fixtures.runner: ok");
