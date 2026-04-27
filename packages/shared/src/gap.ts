import { z } from "zod";

export const GapSeveritySchema = z.union([z.literal("Critical"), z.literal("Important"), z.literal("Watch")]);
export type GapSeverity = z.infer<typeof GapSeveritySchema>;

export const GapStatusSchema = z.union([z.literal("Open"), z.literal("Resolved")]);
export type GapStatus = z.infer<typeof GapStatusSchema>;

export const GapSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  title: z.string(),
  whyItMatters: z.string(),
  stakeholder: z.string(),
  linkedSection: z.string().nullable(),
  severity: GapSeveritySchema,
  status: GapStatusSchema,
  prompt: z.string(),
  resolvedByInternalInputId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Gap = z.infer<typeof GapSchema>;

export const CreateGapInputSchema = z.object({
  title: z.string().min(1),
  whyItMatters: z.string().min(1),
  stakeholder: z.string().min(1),
  linkedSection: z.string().nullable().optional(),
  severity: GapSeveritySchema,
  status: GapStatusSchema.optional(),
  prompt: z.string().min(1),
});

export type CreateGapInput = z.infer<typeof CreateGapInputSchema>;

export const PatchGapInputSchema = z
  .object({
    prompt: z.string().min(1).optional(),
    status: GapStatusSchema.optional(),
    resolvedByInternalInputId: z.string().min(1).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export type PatchGapInput = z.infer<typeof PatchGapInputSchema>;
