import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";

export type OutputWordingMode = "stored" | "ai-polished";

/** Fields that can receive in-place AI-polished display (extensible per output view). */
export type OutputPolishedFieldId = "currentPosition" | "executiveSummary";

export type OutputPolishedFields = Partial<Record<OutputPolishedFieldId, string>>;

export const OUTPUT_WORDING_COPY = {
  controlLabel: "Wording",
  toggleStored: "Stored",
  toggleAiPolished: "AI-polished",
  controlHelper: "Same facts. Drafting support only. AI-polished fields are highlighted.",
  fieldChip: "AI-polished wording",
  fieldHelper: "Same facts. No new information.",
  notPreparedMessage: "AI-polished wording has not been prepared yet.",
  previewPolishedAction: "Preview polished wording",
} as const;

/** Subtle in-place AI field surface (not a nested panel). */
export const AI_POLISHED_FIELD_CLASSNAMES =
  "rounded-[0.5rem] border-l-2 border-l-[color-mix(in_oklab,var(--metis-status-info-fg)_48%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_28%,var(--metis-surface-card))] px-3 py-2.5";

export function shouldShowOutputWordingControl(input: {
  aiSynthesisEnabled: boolean;
  hasPolishContext: boolean;
}): boolean {
  return input.aiSynthesisEnabled && input.hasPolishContext;
}

export function buildPolishedFieldsFromAlternate(input: {
  alternateWording: NormalizedAlternateWording;
  previewPolishedBody?: string | null;
  field: OutputPolishedFieldId;
}): OutputPolishedFields {
  const alternate =
    input.alternateWording?.status === "succeeded" ? input.alternateWording.aiAlternateBody.trim() : "";
  const preview = input.previewPolishedBody?.trim() ?? "";
  const polished = alternate || preview;
  if (!polished) return {};
  return { [input.field]: polished };
}

export function hasPolishedField(
  polishedFields: OutputPolishedFields,
  field: OutputPolishedFieldId,
): boolean {
  return Boolean(polishedFields[field]?.trim());
}

export function canSelectAiPolishedMode(polishedFields: OutputPolishedFields): boolean {
  return Object.values(polishedFields).some((v) => Boolean(v?.trim()));
}

export function isFieldShowingAiPolished(input: {
  mode: OutputWordingMode;
  field: OutputPolishedFieldId;
  polishedFields: OutputPolishedFields;
}): boolean {
  return input.mode === "ai-polished" && hasPolishedField(input.polishedFields, input.field);
}

export function resolveOutputFieldText(input: {
  mode: OutputWordingMode;
  field: OutputPolishedFieldId;
  storedText: string;
  polishedFields: OutputPolishedFields;
}): string {
  if (input.mode === "ai-polished" && hasPolishedField(input.polishedFields, input.field)) {
    return input.polishedFields[input.field]!.trim();
  }
  return input.storedText.trim();
}

export function getOutputWordingControlCopy() {
  return {
    label: OUTPUT_WORDING_COPY.controlLabel,
    toggleStored: OUTPUT_WORDING_COPY.toggleStored,
    toggleAiPolished: OUTPUT_WORDING_COPY.toggleAiPolished,
    helper: OUTPUT_WORDING_COPY.controlHelper,
  };
}

/** Brief polish preview API (executive brief version + executive-summary scope). */
export type BriefPolishPreviewRequest = {
  mode: "executive";
  scope: "executive-summary";
};
