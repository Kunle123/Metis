import { z } from "zod";

export const BriefModeSchema = z.union([z.literal("full"), z.literal("executive")]);
export type BriefMode = z.infer<typeof BriefModeSchema>;

export const BriefConfidenceSchema = z.union([
  z.literal("Confirmed"),
  z.literal("Likely"),
  z.literal("Unclear"),
  z.literal("Needs validation"),
]);
export type BriefConfidence = z.infer<typeof BriefConfidenceSchema>;

/**
 * Optional executive-summary AI pass metadata (Full brief only). Stored in artifact JSON.
 * The deterministic paragraph always lives in `full.sections` (id `executive-summary`).body.
 * When status is `succeeded`, `aiEnhancedBody` holds alternate wording only (no extra claims).
 */
export const ExecutiveSummarySynthesisSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("succeeded"),
    attemptedAtIso: z.string(),
    aiEnhancedBody: z.string(),
    limitations: z.string().optional(),
  }),
  z.object({
    status: z.literal("failed"),
    attemptedAtIso: z.string(),
  }),
]);
export type ExecutiveSummarySynthesis = z.infer<typeof ExecutiveSummarySynthesisSchema>;

export const BriefArtifactSchema = z.object({
  lede: z.string(),
  metadata: z.object({
    audience: z.string().nullable(),
    circulation: z.literal("Internal"),
    lastRevisionLabel: z.string(),
    openGapsLabel: z.string(),
  }),
  full: z.object({
    sections: z.array(
      z.object({
        id: z.union([
          z.literal("executive-summary"),
          z.literal("chronology"),
          z.literal("confirmed-vs-unclear"),
          z.literal("narrative-map"),
          z.literal("implications"),
          z.literal("recommended-actions"),
        ]),
        title: z.string(),
        body: z.string(),
        confidence: BriefConfidenceSchema,
        updatedAtLabel: z.string(),
        evidenceRefs: z.array(z.string()),
      }),
    ),
    executiveSummarySynthesis: ExecutiveSummarySynthesisSchema.optional(),
  }),
  executive: z.object({
    blocks: z.array(z.object({ label: z.string(), body: z.string() })),
    immediateActions: z.array(z.string()),
  }),
});

export type BriefArtifact = z.infer<typeof BriefArtifactSchema>;

export const BriefVersionSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  mode: BriefModeSchema,
  versionNumber: z.number().int(),
  generatedFromIssueUpdatedAt: z.string(),
  artifact: BriefArtifactSchema,
  createdAt: z.string(),
});

export type BriefVersion = z.infer<typeof BriefVersionSchema>;

export const CreateBriefVersionInputSchema = z.object({
  mode: BriefModeSchema,
});

export type CreateBriefVersionInput = z.infer<typeof CreateBriefVersionInputSchema>;

