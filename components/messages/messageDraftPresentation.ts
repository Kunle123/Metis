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
