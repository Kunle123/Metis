/**
 * Run: `npm run test:message-generate` (includes this runner)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { MessageVariantArtifact } from "@metis/shared/messageVariant";

import {
  artifactForStoredWordingCopy,
  buildMessagePolishedFields,
  buildSectionsFromDeterministicSnapshot,
  getMessageOutputWordingState,
  MESSAGE_OUTPUT_WORDING_COPY,
} from "@/components/messages/messageDraftPresentation";
import {
  canSelectAiPolishedMode,
  isFieldShowingAiPolished,
  OUTPUT_WORDING_COPY,
  resolveOutputFieldText,
} from "@/lib/outputs/outputWordingMode";

const ROOT = join(import.meta.dirname, "../..");

function baseArtifact(overrides: Partial<MessageVariantArtifact["metadata"]> = {}): MessageVariantArtifact {
  return {
    templateId: "external_customer_resident_student",
    metadata: {
      publicHeadline: "Consultation update",
      lastRevisionLabel: "now",
      openGapsLabel: "2 open",
      audienceLabel: "Service users",
      lensSource: "stakeholder_group",
      issueLevelAudienceNote: null,
      ...overrides,
    },
    sections: [
      { id: "draft-message", title: "Draft message", body: "Stored line from record." },
      { id: "review-caveats", title: "Review caveats", body: "Do not over-claim." },
    ],
    guardrails: { mustAvoid: ["Final hours"], toneNotes: "Calm" },
  };
}

const deterministicOnly = baseArtifact({ aiWordingPolish: "deterministic_only", aiComparisonAvailable: false });
const withPolish = baseArtifact({
  aiWordingPolish: "ai_polished",
  aiComparisonAvailable: true,
  deterministicSectionBodiesById: {
    "draft-message": "Stored line from record.",
    "review-caveats": "Do not over-claim.",
  },
});
withPolish.sections[0]!.body = "Polished line with clearer structure.";

assert.equal(getMessageOutputWordingState(deterministicOnly).kind, "prepare");
assert.equal(getMessageOutputWordingState(withPolish).kind, "available");

const polishedFields = buildMessagePolishedFields(getMessageOutputWordingState(withPolish));
assert.equal(canSelectAiPolishedMode(polishedFields), true);
assert.equal(
  resolveOutputFieldText({
    mode: "ai-polished",
    field: "messagePrimaryBody",
    storedText: "Stored line from record.",
    polishedFields,
  }),
  "Polished line with clearer structure.",
);
assert.equal(
  isFieldShowingAiPolished({ mode: "stored", field: "messagePrimaryBody", polishedFields }),
  false,
);

const storedSections = buildSectionsFromDeterministicSnapshot(withPolish);
assert.equal(storedSections[0]!.body, "Stored line from record.");
assert.notEqual(withPolish.sections[0]!.body, storedSections[0]!.body);

const copyArtifact = artifactForStoredWordingCopy(withPolish);
assert.equal(copyArtifact.sections[0]!.body, "Stored line from record.");

assert.equal(MESSAGE_OUTPUT_WORDING_COPY.prepareAction, "Prepare AI-polished wording");
assert.equal(MESSAGE_OUTPUT_WORDING_COPY.previewSaveHelper, "Save a draft to prepare AI-polished wording.");
assert.equal(OUTPUT_WORDING_COPY.toggleStored, "Stored");
assert.equal(OUTPUT_WORDING_COPY.toggleAiPolished, "AI-polished");
assert.ok(!MESSAGE_OUTPUT_WORDING_COPY.prepareAction.toLowerCase().includes("compare"));

const panel = readFileSync(join(ROOT, "app/issues/[issueId]/messages/messages-panel.tsx"), "utf8");
const messagesPage = readFileSync(join(ROOT, "app/issues/[issueId]/messages/page.tsx"), "utf8");
assert.ok(panel.includes("OutputWordingModeBar"));
assert.ok(panel.includes("showWordingControl = messagesAiCleanupEnabled"));
assert.ok(panel.includes("previewSaveHelper"));
assert.ok(!panel.includes("shouldShowOutputWordingControl"));
assert.ok(!panel.includes("MessageWordingCompare"));
assert.ok(!panel.includes("Compare wording"));
assert.ok(!panel.includes("Wording comparison"));
assert.ok(!messagesPage.includes("AI-enhanced"));
assert.ok(messagesPage.includes("Stored message wording with optional AI-polished wording when enabled."));

console.log("messageOutputWording fixtures: OK");
