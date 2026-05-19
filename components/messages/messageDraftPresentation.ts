import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import type { MessageVariantArtifact, MessageVariantSection, MessageVariantTemplateId } from "@metis/shared/messageVariant";

export function messageTemplateDisplayName(templateId: MessageVariantTemplateId): string {
  switch (templateId) {
    case "internal_staff_update":
      return "Internal staff update";
    case "media_holding_line":
      return "Media holding line";
    default:
      return "External customer update";
  }
}

export function messagePurposeLine(templateId: MessageVariantTemplateId): string {
  switch (templateId) {
    case "internal_staff_update":
      return "Practical internal wording grounded in the issue record — front-desk line, do-not-say points, and escalation.";
    case "media_holding_line":
      return "Short holding line for press enquiries — confirmed facts only, with explicit do-not-say discipline.";
    default:
      return "Audience-specific external update from confirmed record lines — review caveats before circulation.";
  }
}

const PRIMARY_SECTION_IDS = new Set(["draft-message", "holding-line", "what-is-happening"]);

export function splitMessageSectionsForDisplay(sections: MessageVariantSection[]): {
  primary: MessageVariantSection | null;
  supporting: MessageVariantSection[];
} {
  const primary = sections.find((s) => PRIMARY_SECTION_IDS.has(s.id)) ?? sections[0] ?? null;
  const supporting = sections.filter((s) => s !== primary);
  return { primary, supporting };
}

export function primarySectionLabel(templateId: MessageVariantTemplateId): string {
  switch (templateId) {
    case "internal_staff_update":
      return "Copy-ready line";
    case "media_holding_line":
      return "Holding line";
    default:
      return "Draft message";
  }
}

export function circulationSafetyHints(params: {
  hasSavedDraft: boolean;
  inSync: boolean;
  approvalStatus: MessageApprovalStatus | null;
  claimFindingCount: number;
  criticalFindingCount: number;
}): string[] {
  const hints: string[] = [];
  if (!params.hasSavedDraft) {
    hints.push("Generate and save a draft to run claim alignment review.");
    return hints;
  }
  if (params.approvalStatus !== "Approved" && params.approvalStatus !== "ReadyToCirculate") {
    hints.push("Do not circulate until approved.");
  }
  if (params.claimFindingCount > 0) {
    hints.push("Review claim alignment warnings before use.");
  }
  if (!params.inSync) {
    hints.push("Refresh the saved draft before circulation if the issue record has changed.");
  }
  if (params.criticalFindingCount > 0) {
    hints.push("Critical review risks are flagged — verify against Claims before external use.");
  }
  if (!hints.length) {
    hints.push("Draft is current and has no flagged claim alignment risks — still apply your organisation’s sign-off process.");
  }
  return hints;
}

export function formatMessageGeneratedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export const MESSAGE_OUTPUT_WORDING_COPY = {
  prepareAction: "Prepare AI-polished wording",
  previewSaveHelper: "Save a draft to prepare AI-polished wording.",
  primaryOnlyNote: "AI-polished wording applies to the primary message body only. Supporting sections stay on stored wording.",
  veryClose: "AI-polished wording is very close to the stored draft.",
  prepareFailed: "AI-polished wording could not be prepared. Stored wording remains available.",
} as const;

/** @deprecated Use {@link MESSAGE_OUTPUT_WORDING_COPY}. */
export const MESSAGE_WORDING_COMPARE_COPY = MESSAGE_OUTPUT_WORDING_COPY;

export function normalizeMessageBodyForDiff(text: string): string {
  return String(text ?? "")
    .replaceAll("\\n", "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sections for display/copy — deterministic snapshot when present, else stored sections. */
export function buildSectionsFromDeterministicSnapshot(artifact: MessageVariantArtifact): MessageVariantSection[] {
  const det = artifact.metadata.deterministicSectionBodiesById;
  if (!det || typeof det !== "object") {
    return artifact.sections;
  }
  return artifact.sections.map((section) => ({
    ...section,
    body: det[section.id] ?? section.body,
  }));
}

export type MessageOutputWordingState =
  | { kind: "none" }
  | {
      kind: "available";
      primarySectionId: string;
      storedPrimaryBody: string;
      polishedPrimaryBody: string;
      veryClose: boolean;
    }
  | {
      kind: "prepare";
      primarySectionId: string;
      storedPrimaryBody: string;
    };

/** @deprecated Use {@link MessageOutputWordingState}. */
export type MessageWordingCompareState = MessageOutputWordingState;

export function getMessageOutputWordingState(artifact: MessageVariantArtifact): MessageOutputWordingState {
  const { primary } = splitMessageSectionsForDisplay(artifact.sections);
  if (!primary) return { kind: "none" };

  const det = artifact.metadata.deterministicSectionBodiesById;
  const canCompare = Boolean(artifact.metadata.aiComparisonAvailable && det && typeof det === "object");
  const storedFromSnapshot = det?.[primary.id];
  const storedPrimaryBody =
    typeof storedFromSnapshot === "string" && storedFromSnapshot.trim()
      ? storedFromSnapshot
      : primary.body;

  if (canCompare && storedFromSnapshot) {
    const polishedPrimaryBody = primary.body;
    const veryClose =
      normalizeMessageBodyForDiff(storedPrimaryBody) === normalizeMessageBodyForDiff(polishedPrimaryBody);
    return {
      kind: "available",
      primarySectionId: primary.id,
      storedPrimaryBody,
      polishedPrimaryBody,
      veryClose,
    };
  }

  return {
    kind: "prepare",
    primarySectionId: primary.id,
    storedPrimaryBody,
  };
}

/** @deprecated Use {@link getMessageOutputWordingState}. */
export const getMessageWordingCompareState = getMessageOutputWordingState;

export function buildMessagePolishedFields(
  wordingState: MessageOutputWordingState,
): Partial<Record<"messagePrimaryBody", string>> {
  if (wordingState.kind !== "available") return {};
  return { messagePrimaryBody: wordingState.polishedPrimaryBody };
}

/** Artifact shaped for markdown copy / circulation — always stored (deterministic) wording. */
export function artifactForStoredWordingCopy(artifact: MessageVariantArtifact): MessageVariantArtifact {
  return {
    ...artifact,
    sections: buildSectionsFromDeterministicSnapshot(artifact),
  };
}
