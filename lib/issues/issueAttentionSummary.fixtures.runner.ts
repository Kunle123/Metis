import assert from "node:assert";

import { approvalCoordinationNeedsAttention, buildIssueAttentionSummary } from "./issueAttentionSummary";

const P = "/issues/demo";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`issueAttentionSummary: OK — ${name}`);
  } catch (e) {
    console.error(`issueAttentionSummary: FAIL — ${name}`, e);
    process.exit(1);
  }
}

const baseline = (): Parameters<typeof buildIssueAttentionSummary>[0] => ({
  issueRoutePrefix: P,
  gaps: [],
  needsValidationClaimsCount: 0,
  assumptionClaimsCount: 0,
  brief: {
    full: { hasStored: false, needsRefresh: false },
    executive: { hasStored: false, needsRefresh: false },
  },
  anyMessageDraftStale: false,
  messageClaimAlignment: null,
  latestMessageVariantsNeedCoordination: false,
  latestExportNeedsCoordination: false,
  showRestrictedObservationInfo: false,
});

run("clear state returns no actionable rows", () => {
  assert.deepStrictEqual([], buildIssueAttentionSummary(baseline()));
});

run("open gaps produce linked item", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    gaps: [{ status: "Open", severity: "Watch" }],
  });
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0]!.tone, "warning");
  assert.strictEqual(rows[0]!.href, `${P}/gaps`);
});

run("critical severity gaps elevate tone", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    gaps: [{ status: "Open", severity: "Critical" }],
  });
  assert.strictEqual(rows[0]!.tone, "critical");
});

run("needs-validation claims outweigh assumptions message", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    needsValidationClaimsCount: 2,
    assumptionClaimsCount: 5,
  });
  const needVal = rows.find((r) => r.id === "claims_validation");
  assert.ok(needVal && needVal.href === `${P}/claims`);
  assert.ok(!rows.some((r) => r.id === "claims_assumptions"));
});

run("assumptions alone emit calm info row", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    assumptionClaimsCount: 3,
  });
  assert.strictEqual(rows[0]?.id, "claims_assumptions");
  assert.strictEqual(rows[0]?.tone, "info");
});

run("stale brief rows link to modes", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    brief: {
      full: { hasStored: true, needsRefresh: true },
      executive: { hasStored: true, needsRefresh: true },
    },
  });
  const full = rows.find((r) => r.id === "brief_full_refresh");
  const exe = rows.find((r) => r.id === "brief_exec_refresh");
  assert.strictEqual(full?.href, `${P}/brief?mode=full`);
  assert.strictEqual(exe?.href, `${P}/brief?mode=executive`);
});

run("aggregate message staleness fires once", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    anyMessageDraftStale: true,
  });
  assert.ok(rows.some((r) => r.id === "message_draft_refresh"));
});

run("claim alignment surfaces warnings", () => {
  const warn = buildIssueAttentionSummary({
    ...baseline(),
    messageClaimAlignment: { hasCriticalFindings: false, hasNonCriticalFindings: true },
  });
  assert.ok(warn.some((r) => r.id === "claim_alignment_warning"));

  const crit = buildIssueAttentionSummary({
    ...baseline(),
    messageClaimAlignment: { hasCriticalFindings: true, hasNonCriticalFindings: false },
  });
  assert.ok(crit.some((r) => r.id === "claim_alignment_critical"));
  assert.strictEqual(crit.some((r) => r.id === "claim_alignment_warning"), false);
});

run("approval coordination flags drafts and saves exports", () => {
  assert.strictEqual(true, approvalCoordinationNeedsAttention("Draft"));
  assert.strictEqual(true, approvalCoordinationNeedsAttention("InReview"));
  assert.strictEqual(false, approvalCoordinationNeedsAttention("Approved"));

  const rows = buildIssueAttentionSummary({
    ...baseline(),
    latestMessageVariantsNeedCoordination: true,
    latestExportNeedsCoordination: true,
  });
  assert.ok(rows.some((r) => r.id === "message_approval_coordination"));
  assert.ok(rows.some((r) => r.id === "export_coordination"));
});

run("approval helper ignores circulate-ready statuses", () => {
  assert.strictEqual(false, approvalCoordinationNeedsAttention("ReadyToCirculate"));
  assert.strictEqual(false, approvalCoordinationNeedsAttention("Sent"));
  assert.strictEqual(false, approvalCoordinationNeedsAttention("Superseded"));
});

run("restricted cue is informational and links inward", () => {
  const rows = buildIssueAttentionSummary({
    ...baseline(),
    showRestrictedObservationInfo: true,
  });
  const r = rows.find((row) => row.id === "restricted_observations");
  assert.ok(r);
  assert.strictEqual(r!.href, `${P}/input`);
});

console.log("issueAttentionSummary fixtures: OK");
