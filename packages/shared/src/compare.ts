import { z } from "zod";

import { BriefModeSchema } from "./briefVersion";

export const CirculationStateSchema = z.union([
  z.literal("Updated since last version"),
  z.literal("Ready for review"),
  z.literal("Needs validation"),
  z.literal("Ready to circulate"),
  z.literal("Open gap"),
  z.literal("Source conflict"),
  z.literal("Blocked"),
]);
export type CirculationState = z.infer<typeof CirculationStateSchema>;

export const CompareGroupIdSchema = z.union([
  z.literal("new_facts"),
  z.literal("changed_assumptions"),
  z.literal("resolved_uncertainties"),
  z.literal("changed_recommendations"),
]);
export type CompareGroupId = z.infer<typeof CompareGroupIdSchema>;

export const CompareSummarySchema = z.object({
  groups: z.array(
    z.object({
      id: CompareGroupIdSchema,
      items: z.array(z.string()),
    }),
  ),
  readinessMovement: z
    .array(
      z.object({
        label: z.string(),
        from: CirculationStateSchema,
        to: CirculationStateSchema,
        direction: z.union([z.literal("improved"), z.literal("worsened"), z.literal("stable")]),
        detail: z.string(),
      }),
    )
    .default([]),
});
export type CompareSummary = z.infer<typeof CompareSummarySchema>;

export const CompareRequestSchema = z.object({
  mode: BriefModeSchema,
  fromBriefVersionId: z.string(),
  toBriefVersionId: z.string(),
});
export type CompareRequest = z.infer<typeof CompareRequestSchema>;

export const CompareResponseSchema = z.object({
  issueId: z.string(),
  mode: BriefModeSchema,
  from: z.object({
    briefVersionId: z.string(),
    versionNumber: z.number().int(),
    createdAt: z.string(),
    circulationState: CirculationStateSchema,
    circulationNotes: z.string().nullable(),
  }),
  to: z.object({
    briefVersionId: z.string(),
    versionNumber: z.number().int(),
    createdAt: z.string(),
    circulationState: CirculationStateSchema,
    circulationNotes: z.string().nullable(),
  }),
  changeCount: z.number().int(),
  summary: CompareSummarySchema,
  persisted: z.boolean(),
  comparisonId: z.string().nullable(),
  createdAt: z.string().nullable(),
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

