/**
 * Claims register helpers — no DB.
 * Run: `npm run test:claims-register`
 */
import assert from "node:assert/strict";
import type { Claim } from "@prisma/client";

import { coerceClaimStatus } from "./coerceClaimStatus";
import { claimStatusDisplayLabel } from "./claimStatusUi";
import {
  buildExecutiveClaimsDoNotSayBullets,
  formatClaimsBriefBlock,
  formatExecutiveClaimsAndAssumptionsBody,
  groupClaimsForSynthesis,
  hasActiveClaimsForBriefing,
} from "./claimsForGeneration";
import { formatClaimCode } from "@/lib/issueRecordCodes";

assert.equal(coerceClaimStatus(null), "NeedsValidation");
assert.equal(coerceClaimStatus(undefined), "NeedsValidation");
assert.equal(coerceClaimStatus(""), "NeedsValidation");
assert.equal(coerceClaimStatus("not-a-status"), "NeedsValidation");
assert.equal(coerceClaimStatus("Confirmed"), "Confirmed");

assert.equal(claimStatusDisplayLabel("NeedsValidation"), "Needs validation");
assert.equal(formatClaimCode(0), null);
assert.equal(formatClaimCode(1), "CLM-001");
assert.equal(formatClaimCode(42), "CLM-042");

const now = new Date();
function c(p: Partial<Claim> & Pick<Claim, "claimNumber" | "text" | "status">): Claim {
  return {
    id: p.id ?? `id-${p.claimNumber}`,
    issueId: p.issueId ?? "iss",
    claimNumber: p.claimNumber,
    text: p.text,
    status: p.status,
    notes: p.notes ?? null,
    createdByUserId: null,
    updatedByUserId: null,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

const sampleClaims = [
  c({ claimNumber: 1, text: "Alpha", status: "Confirmed", notes: "n1" }),
  c({ claimNumber: 2, text: "Beta", status: "Assumption", notes: null }),
  c({ claimNumber: 3, text: "Gamma", status: "NeedsValidation", notes: null }),
  c({ claimNumber: 999, text: "Retired line", status: "Superseded", notes: null }),
];

const grouped = groupClaimsForSynthesis(sampleClaims);
assert.equal(grouped.confirmed.length, 1);
assert.equal(grouped.assumptions.length, 1);
assert.equal(grouped.needsValidation.length, 1);
assert.equal(grouped.confirmed[0]?.code, "CLM-001");

const briefBlock = formatClaimsBriefBlock(sampleClaims);
assert.match(briefBlock, /CLM-001/);
assert.match(briefBlock, /### Confirmed claims/);
assert.match(briefBlock, /### Needs validation — do not state as fact/);
assert.ok(!briefBlock.includes("CLM-999"), "superseded claim omitted from briefing block");
assert.match(briefBlock, /Superseded claims/i);

assert.equal(hasActiveClaimsForBriefing(sampleClaims), true);
assert.equal(hasActiveClaimsForBriefing([c({ claimNumber: 999, text: "Old", status: "Superseded" })]), false);

const execCompact = formatExecutiveClaimsAndAssumptionsBody(sampleClaims);
assert.ok(execCompact.includes("CLM-001"));
assert.ok(!execCompact.includes("Claims register"));
assert.match(execCompact, /Claims position: 1 confirmed · 1 assumption · 1 need validation · 1 superseded/);

const doNotSay = buildExecutiveClaimsDoNotSayBullets([
  ...sampleClaims,
  c({ claimNumber: 5, text: "The proposed opening hours are final.", status: "NeedsValidation" }),
]);
assert.ok(doNotSay.some((l) => /final opening hours/i.test(l)));

console.log("claims.fixtures.runner: ok");
