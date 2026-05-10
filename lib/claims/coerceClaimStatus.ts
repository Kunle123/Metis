import { ClaimStatusSchema, type ClaimStatus } from "@metis/shared/claim";

export function coerceClaimStatus(raw: string | null | undefined): ClaimStatus {
  const p = ClaimStatusSchema.safeParse(typeof raw === "string" ? raw : "");
  return p.success ? p.data : "NeedsValidation";
}
