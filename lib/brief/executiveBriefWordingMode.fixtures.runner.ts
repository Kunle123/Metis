/**
 * Run: `npm run test:brief-presentation` (includes this runner)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildExecutivePolishedFields,
  canSelectExecutiveAiPolishedMode,
  EXECUTIVE_BRIEF_WORDING_COPY,
  executivePresentationUsesInlineDrawer,
  getExecutiveWordingControlCopy,
  isFieldShowingAiPolished,
  resolveFieldDisplayText,
  shouldShowExecutiveBriefWordingControl,
} from "./executiveBriefWordingMode";

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`executiveBriefWordingMode: OK — ${name}`);
  } catch (e) {
    console.error(`executiveBriefWordingMode: FAIL — ${name}`, e);
    process.exit(1);
  }
}

run("executive uses shared segmented control via OutputWordingModeBar", () => {
  const exec = readFileSync(
    join(import.meta.dirname, "../../components/brief/ExecutiveBriefPresentation.tsx"),
    "utf8",
  );
  assert.ok(exec.includes("OutputWordingModeBar"));
  assert.ok(!exec.includes("ExecutiveBriefWordingModeBar"));
});

run("renders Wording control copy when AI synthesis enabled", () => {
  assert.equal(shouldShowExecutiveBriefWordingControl({ briefAiSynthesisEnabled: true, hasBriefVersion: true }), true);
  const copy = getExecutiveWordingControlCopy();
  assert.equal(copy.label, "Wording");
  assert.equal(copy.toggleStored, "Stored");
  assert.equal(copy.toggleAiPolished, "AI-polished");
  assert.equal(copy.helper, "Same facts. Drafting support only. AI-polished fields are highlighted.");
});

run("hides control when AI disabled", () => {
  assert.equal(shouldShowExecutiveBriefWordingControl({ briefAiSynthesisEnabled: false, hasBriefVersion: true }), false);
});

run("does not use inline drawer inside Current position", () => {
  assert.equal(executivePresentationUsesInlineDrawer(), false);
  assert.notEqual(EXECUTIVE_BRIEF_WORDING_COPY.controlLabel, "AI wording polish");
  assert.notEqual(EXECUTIVE_BRIEF_WORDING_COPY.controlLabel, "Optional wording comparison");
});

run("AI-polished mode resolves in-place current position text", () => {
  const polishedFields = buildExecutivePolishedFields({
    alternateWording: {
      status: "succeeded",
      attemptedAtIso: "2026-01-01T00:00:00.000Z",
      aiAlternateBody: "AI polished current position text.",
    },
    storedCurrentPositionBody: "Stored current position text.",
  });
  assert.equal(
    resolveFieldDisplayText({
      mode: "ai-polished",
      field: "currentPosition",
      storedText: "Stored current position text.",
      polishedFields,
    }),
    "AI polished current position text.",
  );
});

run("stored mode renders stored current position without AI marker", () => {
  const polishedFields = buildExecutivePolishedFields({
    alternateWording: {
      status: "succeeded",
      attemptedAtIso: "2026-01-01T00:00:00.000Z",
      aiAlternateBody: "AI polished current position text.",
    },
    storedCurrentPositionBody: "Stored current position text.",
  });
  assert.equal(
    isFieldShowingAiPolished({ mode: "stored", field: "currentPosition", polishedFields }),
    false,
  );
  assert.equal(
    resolveFieldDisplayText({
      mode: "stored",
      field: "currentPosition",
      storedText: "Stored current position text.",
      polishedFields,
    }),
    "Stored current position text.",
  );
});

run("AI-polished field has marker when mode is ai-polished", () => {
  const polishedFields = buildExecutivePolishedFields({
    alternateWording: {
      status: "succeeded",
      attemptedAtIso: "2026-01-01T00:00:00.000Z",
      aiAlternateBody: "AI text.",
    },
    storedCurrentPositionBody: "Stored.",
  });
  assert.equal(
    isFieldShowingAiPolished({ mode: "ai-polished", field: "currentPosition", polishedFields }),
    true,
  );
  assert.equal(EXECUTIVE_BRIEF_WORDING_COPY.fieldChip, "AI-polished wording");
});

run("preview action copy when no alternate exists yet", () => {
  const polishedFields = buildExecutivePolishedFields({
    alternateWording: null,
    storedCurrentPositionBody: "Stored.",
  });
  assert.equal(canSelectExecutiveAiPolishedMode(polishedFields), false);
  assert.equal(EXECUTIVE_BRIEF_WORDING_COPY.previewPolishedAction, "Preview polished wording");
});
