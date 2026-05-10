import { MessageApprovalStatusSchema, type MessageApprovalStatus } from "@metis/shared/approvalStatus";

export function coerceMessageApprovalStatus(raw: string | null | undefined): MessageApprovalStatus {
  const p = MessageApprovalStatusSchema.safeParse(typeof raw === "string" ? raw : "");
  return p.success ? p.data : "Draft";
}
