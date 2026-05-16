import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import type { MessageVariantTemplateId } from "@metis/shared/messageVariant";

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
      return "Reassure staff, reduce speculation, and direct updates through official channels.";
    case "media_holding_line":
      return "Holding line for external enquiries — subject to approval and claim checks.";
    default:
      return "Clear, measured update for customers, residents, or students — only what is on the issue record.";
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
