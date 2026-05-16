/**
 * Run: `npm run test:brief-presentation` (add script) or `tsx lib/brief/parseExecutiveBriefPresentation.fixtures.runner.ts`
 */
import assert from "node:assert/strict";

import type { BriefArtifact } from "@metis/shared/briefVersion";

import { parseExecutiveBriefPresentation, parseExecutiveLineItem } from "./parseExecutiveBriefPresentation";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`briefPresentation: OK — ${name}`);
  } catch (e) {
    console.error(`briefPresentation: FAIL — ${name}`, e);
    process.exit(1);
  }
}

function artifact(blocks: { label: string; body: string }[]): BriefArtifact {
  return {
    lede: "Leadership line for the record.",
    metadata: {
      audience: null,
      circulation: "Internal",
      lastRevisionLabel: "v1",
      openGapsLabel: "2 open",
    },
    full: { sections: [] },
    executive: { blocks, immediateActions: [] },
  };
}

run("parses decisions and strips UUIDs", () => {
  const model = parseExecutiveBriefPresentation({
    issueTitle: "Test issue",
    artifact: artifact([
      {
        label: "Current assessment",
        body: "Status: Active\nSeverity: High\nUrgency: Critical\nBriefing posture: Holding\nOpen questions: 2 on the issue record · 2 open in tracker\nIssue owner: not recorded yet.",
      },
      { label: "Recommended decisions / next actions", body: "1) Confirm approver\n2) Validate line" },
      {
        label: "Confirmed facts",
        body: "- Fact one\n- Fact two",
      },
      {
        label: "What not to say yet / uncertainty guardrails",
        body: "Do not speculate on injuries.\n\nAvoid escalatory language.",
      },
    ]),
    changeHighlights: ["Open question added"],
  });
  assert.equal(model.decisions.length, 2);
  assert.ok(!model.position.lede.includes("22222222"));
  assert.equal(model.safeToSay.length, 2);
  assert.ok(model.doNotSayYet.some((l) => /do not speculate/i.test(l)));
  assert.deepEqual(model.whatChanged, ["Open question added"]);
});

run("splits claims register groups", () => {
  const model = parseExecutiveBriefPresentation({
    issueTitle: "Claims test",
    artifact: artifact([
      {
        label: "Claims and assumptions",
        body: "### Confirmed claims\n- CLM-1: Verified line\n\n### Assumptions — phrase conditionally\n- CLM-2: Working line\n\n### Needs validation — do not state as fact\n- CLM-3: Unverified line",
      },
    ]),
  });
  assert.equal(model.claimGroups.length, 3);
  assert.equal(model.claimGroups[1]?.id, "assumptions");
  assert.equal(model.claimGroups[1]?.items[0]?.code, "CLM-2");
  assert.ok(model.doNotSayYet.some((l) => /CLM-3/.test(l)));
});

run("parses claim record codes", () => {
  const item = parseExecutiveLineItem("CLM-001: Board has not signed off.");
  assert.equal(item.code, "CLM-001");
  assert.match(item.text, /signed off/i);
});

run("omits what changed when no highlights and no block", () => {
  const model = parseExecutiveBriefPresentation({
    issueTitle: "Stable",
    artifact: artifact([{ label: "Executive summary", body: "Situation stable." }]),
  });
  assert.equal(model.whatChanged.length, 0);
});
