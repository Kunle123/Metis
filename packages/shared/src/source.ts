import { z } from "zod";

export const SourceTierSchema = z.union([
  z.literal("Official"),
  z.literal("Internal"),
  z.literal("Major media"),
  z.literal("Market signal"),
]);
export type SourceTier = z.infer<typeof SourceTierSchema>;

export const SourceSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  sourceCode: z.string(),
  tier: SourceTierSchema,
  title: z.string(),
  note: z.string().nullable(),
  snippet: z.string().nullable(),
  reliability: z.string().nullable(),
  linkedSection: z.string().nullable(),
  url: z.string().nullable(),
  timestampLabel: z.string().nullable(),
  createdAt: z.string(),
});

export type Source = z.infer<typeof SourceSchema>;

export const CreateSourceInputSchema = z.object({
  sourceCode: z.string().min(1).optional(),
  tier: SourceTierSchema,
  title: z.string().min(1),
  note: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
  reliability: z.string().nullable().optional(),
  linkedSection: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  timestampLabel: z.string().nullable().optional(),
});

export type CreateSourceInput = z.infer<typeof CreateSourceInputSchema>;

