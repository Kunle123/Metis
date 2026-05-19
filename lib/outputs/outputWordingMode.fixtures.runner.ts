/**
 * Run: `npm run test:brief-presentation` (includes this runner)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AI_POLISHED_FIELD_CLASSNAMES,
  buildPolishedFieldsFromAlternate,
  canSelectAiPolishedMode,
  getOutputWordingControlCopy,
  isFieldShowingAiPolished,
  OUTPUT_WORDING_COPY,
  resolveOutputFieldText,
  shouldShowOutputWordingControl,
} from "./outputWordingMode";

const ROOT = join(import.meta.dirname, "../..");

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`outputWordingMode: OK — ${name}`);
  } catch (e) {
    console.error(`outputWordingMode: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("shared Wording control uses design-system segmented labels", () => {
  const copy = getOutputWordingControlCopy();
  assert.equal(copy.label, "Wording");
  assert.equal(copy.toggleStored, "Stored");
  assert.equal(copy.toggleAiPolished, "AI-polished");
  assert.equal(copy.helper, "Same facts. Drafting support only. AI-polished fields are highlighted.");
});

run("OutputWordingModeBar uses SegmentedControl not bespoke toggle", () => {
  const bar = readFileSync(join(ROOT, "components/outputs/OutputWordingModeBar.tsx"), "utf8");
  assert.ok(bar.includes("SegmentedControl"));
  assert.ok(!bar.includes("ModeToggleButton"));
  assert.ok(!bar.includes("rounded border px-2.5 py-1 text-[0.72rem]"));
});

run("Executive presentation uses shared OutputWordingModeBar", () => {
  const exec = readFileSync(join(ROOT, "components/brief/ExecutiveBriefPresentation.tsx"), "utf8");
  assert.ok(exec.includes("OutputWordingModeBar"));
  assert.ok(!exec.includes("ExecutiveBriefWordingModeBar"));
  assert.ok(!exec.includes("ModeToggleButton"));
});

run("Full brief uses shared OutputWordingModeBar not section polish panel", () => {
  const full = readFileSync(join(ROOT, "components/brief/FullBriefPresentation.tsx"), "utf8");
  const page = readFileSync(join(ROOT, "app/issues/[issueId]/brief/page.tsx"), "utf8");
  assert.ok(full.includes("OutputWordingModeBar"));
  assert.ok(!page.includes("BriefExecutiveSummaryCompare"));
  assert.ok(!full.includes("Optional · Wording polish"));
});

run("AI-polished mode replaces executive summary in place", () => {
  const polishedFields = buildPolishedFieldsFromAlternate({
    alternateWording: {
      status: "succeeded",
      attemptedAtIso: "2026-01-01T00:00:00.000Z",
      aiAlternateBody: "AI executive summary.",
    },
    field: "executiveSummary",
  });
  assert.equal(
    resolveOutputFieldText({
      mode: "ai-polished",
      field: "executiveSummary",
      storedText: "Stored executive summary.",
      polishedFields,
    }),
    "AI executive summary.",
  );
});

run("stored mode has no AI field marker", () => {
  const polishedFields = buildPolishedFieldsFromAlternate({
    alternateWording: {
      status: "succeeded",
      attemptedAtIso: "2026-01-01T00:00:00.000Z",
      aiAlternateBody: "AI text.",
    },
    field: "executiveSummary",
  });
  assert.equal(
    isFieldShowingAiPolished({ mode: "stored", field: "executiveSummary", polishedFields }),
    false,
  );
});

run("AI-polished field styling helper is defined", () => {
  assert.ok(AI_POLISHED_FIELD_CLASSNAMES.includes("border-l-2"));
  assert.equal(OUTPUT_WORDING_COPY.fieldChip, "AI-polished wording");
});

run("disabled AI hides output wording control", () => {
  assert.equal(shouldShowOutputWordingControl({ aiSynthesisEnabled: false, hasPolishContext: true }), false);
});

run("preview unavailable until polish exists", () => {
  assert.equal(canSelectAiPolishedMode({}), false);
  assert.equal(OUTPUT_WORDING_COPY.previewPolishedAction, "Preview polished wording");
});
