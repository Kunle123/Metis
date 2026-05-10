import { z } from "zod";

/** Persisted coordination label for message drafts / export packages (no workflow engine yet). */
export const MessageApprovalStatusSchema = z.enum([
  "Draft",
  "InReview",
  "Approved",
  "ReadyToCirculate",
  "Sent",
  "Superseded",
]);
export type MessageApprovalStatus = z.infer<typeof MessageApprovalStatusSchema>;

export const MESSAGE_APPROVAL_STATUS_ORDER = MessageApprovalStatusSchema.options;

export function approvalStatusDisplayLabel(status: MessageApprovalStatus): string {
  switch (status) {
    case "Draft":
      return "Draft";
    case "InReview":
      return "In review";
    case "Approved":
      return "Approved";
    case "ReadyToCirculate":
      return "Ready to circulate";
    case "Sent":
      return "Sent";
    case "Superseded":
      return "Superseded";
    default:
      return String(status);
  }
}

/** API body for PATCH .../approval (message variant / export package). */
export const PatchApprovalStatusBodySchema = z.object({
  approvalStatus: MessageApprovalStatusSchema,
});
export type PatchApprovalStatusBody = z.infer<typeof PatchApprovalStatusBodySchema>;
