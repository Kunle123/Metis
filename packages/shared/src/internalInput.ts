import { z } from "zod";

export const InternalInputConfidenceSchema = z.union([
  z.literal("Confirmed"),
  z.literal("Likely"),
  z.literal("Unclear"),
  z.literal("Needs validation"),
]);
export type InternalInputConfidence = z.infer<typeof InternalInputConfidenceSchema>;

export const InternalObservationVisibilitySchema = z.union([z.literal("Organisation"), z.literal("Restricted")]);
export type InternalObservationVisibility = z.infer<typeof InternalObservationVisibilitySchema>;

export const InternalInputSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  observationNumber: z.number().int().positive(),
  role: z.string(),
  name: z.string(),
  response: z.string(),
  confidence: InternalInputConfidenceSchema,
  excludedFromBrief: z.boolean().optional().default(false),
  linkedSection: z.string().nullable(),
  visibility: InternalObservationVisibilitySchema.optional().nullable(),
  createdByUserId: z.string().nullable().optional(),
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
  visibility: InternalObservationVisibilitySchema.optional(),
  timestampLabel: z.string().nullable().optional(),
});

export type CreateInternalInputInput = z.infer<typeof CreateInternalInputInputSchema>;

export const PatchInternalInputInputSchema = z
  .object({
    excludedFromBrief: z.boolean().optional(),
    visibility: InternalObservationVisibilitySchema.optional(),
  })
  .refine((v) => v.excludedFromBrief !== undefined || v.visibility !== undefined, {
    message: "At least one of excludedFromBrief or visibility is required",
  });

export type PatchInternalInputInput = z.infer<typeof PatchInternalInputInputSchema>;
