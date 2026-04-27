import { z } from "zod";

export const InternalInputConfidenceSchema = z.union([
  z.literal("Confirmed"),
  z.literal("Likely"),
  z.literal("Unclear"),
  z.literal("Needs validation"),
]);
export type InternalInputConfidence = z.infer<typeof InternalInputConfidenceSchema>;

export const InternalInputSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  role: z.string(),
  name: z.string(),
  response: z.string(),
  confidence: InternalInputConfidenceSchema,
  excludedFromBrief: z.boolean().optional().default(false),
  linkedSection: z.string().nullable(),
  visibility: z.string().nullable(),
  timestampLabel: z.string().nullable(),
  createdAt: z.string(),
});

export type InternalInput = z.infer<typeof InternalInputSchema>;

export const CreateInternalInputInputSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
  response: z.string().min(1),
  confidence: InternalInputConfidenceSchema,
  excludedFromBrief: z.boolean().optional(),
  linkedSection: z.string().nullable().optional(),
  visibility: z.string().nullable().optional(),
  timestampLabel: z.string().nullable().optional(),
});

export type CreateInternalInputInput = z.infer<typeof CreateInternalInputInputSchema>;

export const PatchInternalInputInputSchema = z.object({
  excludedFromBrief: z.boolean().optional(),
});

export type PatchInternalInputInput = z.infer<typeof PatchInternalInputInputSchema>;
