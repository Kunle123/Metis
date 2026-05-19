import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import {
  AI_POLISHED_FIELD_CLASSNAMES,
  buildPolishedFieldsFromAlternate,
  canSelectAiPolishedMode,
  getOutputWordingControlCopy,
  hasPolishedField,
  isFieldShowingAiPolished as isOutputFieldShowingAiPolished,
  OUTPUT_WORDING_COPY,
  resolveOutputFieldText,
  shouldShowOutputWordingControl,
  type OutputPolishedFields,
  type OutputWordingMode,
} from "@/lib/outputs/outputWordingMode";

export type ExecutiveBriefWordingMode = OutputWordingMode;
export type ExecutiveBriefPolishedFieldId = "currentPosition";
export type ExecutiveBriefPolishedFields = Pick<OutputPolishedFields, "currentPosition">;

export const EXECUTIVE_BRIEF_WORDING_COPY = OUTPUT_WORDING_COPY;
export const EXECUTIVE_BRIEF_AI_FIELD_CLASS = AI_POLISHED_FIELD_CLASSNAMES;

export function shouldShowExecutiveBriefWordingControl(input: {
  briefAiSynthesisEnabled: boolean;
  hasBriefVersion: boolean;
}): boolean {
  return shouldShowOutputWordingControl({
    aiSynthesisEnabled: input.briefAiSynthesisEnabled,
    hasPolishContext: input.hasBriefVersion,
  });
}

export function buildExecutivePolishedFields(input: {
  alternateWording: NormalizedAlternateWording;
  previewPolishedBody?: string | null;
  storedCurrentPositionBody: string;
}): ExecutiveBriefPolishedFields {
  return buildPolishedFieldsFromAlternate({
    alternateWording: input.alternateWording,
    previewPolishedBody: input.previewPolishedBody,
    field: "currentPosition",
  });
}

export function hasExecutivePolishedField(
  polishedFields: ExecutiveBriefPolishedFields,
  field: ExecutiveBriefPolishedFieldId,
): boolean {
  return hasPolishedField(polishedFields, field);
}

export function canSelectExecutiveAiPolishedMode(polishedFields: ExecutiveBriefPolishedFields): boolean {
  return canSelectAiPolishedMode(polishedFields);
}

export function isFieldShowingAiPolished(input: {
  mode: ExecutiveBriefWordingMode;
  field: ExecutiveBriefPolishedFieldId;
  polishedFields: ExecutiveBriefPolishedFields;
}): boolean {
  return isOutputFieldShowingAiPolished({
    mode: input.mode,
    field: input.field,
    polishedFields: input.polishedFields,
  });
}

export function resolveFieldDisplayText(input: {
  mode: ExecutiveBriefWordingMode;
  field: ExecutiveBriefPolishedFieldId;
  storedText: string;
  polishedFields: ExecutiveBriefPolishedFields;
}): string {
  return resolveOutputFieldText({
    mode: input.mode,
    field: input.field,
    storedText: input.storedText,
    polishedFields: input.polishedFields,
  });
}

export function executivePresentationUsesInlineDrawer(): boolean {
  return false;
}

export function getExecutiveWordingControlCopy() {
  return getOutputWordingControlCopy();
}

export function executiveBriefWordingCompareDeterministicBody(input: {
  executiveSummaryStoredBody: string;
  presentationExecutiveSummary: string;
}): string {
  return (
    input.executiveSummaryStoredBody.trim() ||
    input.presentationExecutiveSummary.trim()
  );
}

export function getExecutiveSummaryBlockBody(
  blocks: { label: string; body: string }[] | undefined,
): string {
  return blocks?.find((b) => b.label.trim() === "Executive summary")?.body?.trim() ?? "";
}
