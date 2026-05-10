import { z } from "zod";

export const ClaimStatusSchema = z.enum(["Confirmed", "Assumption", "NeedsValidation", "Superseded"]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

const uuidList = z.array(z.string().uuid()).optional().default([]);

export const CreateClaimBodySchema = z.object({
  text: z.string().min(1).max(12_000),
  status: ClaimStatusSchema.optional(),
  notes: z.string().max(12_000).optional().nullable(),
  sourceIds: uuidList,
  internalInputIds: uuidList,
  gapIds: uuidList,
});
export type CreateClaimBody = z.infer<typeof CreateClaimBodySchema>;

export const PatchClaimBodySchema = z
  .object({
    text: z.string().min(1).max(12_000).optional(),
    status: ClaimStatusSchema.optional(),
    notes: z.string().max(12_000).optional().nullable(),
    sourceIds: z.array(z.string().uuid()).optional(),
    internalInputIds: z.array(z.string().uuid()).optional(),
    gapIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((val, ctx) => {
    const has =
      val.text !== undefined ||
      val.status !== undefined ||
      val.notes !== undefined ||
      val.sourceIds !== undefined ||
      val.internalInputIds !== undefined ||
      val.gapIds !== undefined;
    if (!has) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one field is required" });
    }
  });
export type PatchClaimBody = z.infer<typeof PatchClaimBodySchema>;
