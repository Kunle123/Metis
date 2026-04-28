import { z } from "zod";

export const MessageVariantTemplateIdSchema = z.literal("external_customer_resident_student");
export type MessageVariantTemplateId = z.infer<typeof MessageVariantTemplateIdSchema>;

export const MessageVariantSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
});
export type MessageVariantSection = z.infer<typeof MessageVariantSectionSchema>;

export const MessageVariantArtifactSchema = z.object({
  templateId: MessageVariantTemplateIdSchema,
  metadata: z.object({
    publicHeadline: z.string(),
    lastRevisionLabel: z.string(),
    openGapsLabel: z.string(),
    audienceLabel: z.string(),
    lensSource: z.union([
      z.literal("issue_stakeholder"),
      z.literal("issue_audience_only"),
      z.literal("stakeholder_group"),
    ]),
    issueLevelAudienceNote: z.string().nullable(),
    /** Present when using an organisation audience group (new rows). */
    stakeholderGroupId: z.string().uuid().nullable().optional(),
    /** True when IssueStakeholder row supplied issue-specific lens fields used in copy. */
    issueSpecificLensApplied: z.boolean().optional(),
    /** e.g. defaults-only message when no IssueStakeholder row. */
    lensEnrichmentNote: z.string().nullable().optional(),
  }),
  sections: z.array(MessageVariantSectionSchema),
  guardrails: z.object({
    mustAvoid: z.array(z.string()),
    toneNotes: z.string(),
  }),
});
export type MessageVariantArtifact = z.infer<typeof MessageVariantArtifactSchema>;

export const MessageVariantRecordSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  templateId: MessageVariantTemplateIdSchema,
  versionNumber: z.number().int(),
  generatedFromIssueUpdatedAt: z.string(),
  stakeholderGroupId: z.string().nullable(),
  issueStakeholderId: z.string().nullable(),
  audienceSnapshot: z.record(z.string(), z.unknown()),
  artifact: MessageVariantArtifactSchema,
  createdAt: z.string(),
});
export type MessageVariantRecord = z.infer<typeof MessageVariantRecordSchema>;

export const CreateMessageVariantInputSchema = z.object({
  templateId: MessageVariantTemplateIdSchema,
  /** null = audience note from issue setup only; otherwise organisation StakeholderGroup id. */
  stakeholderGroupId: z.string().uuid().nullable().optional(),
});
export type CreateMessageVariantInput = z.infer<typeof CreateMessageVariantInputSchema>;

/** GET /message-variants: optional filter scoped to audience bucket (null = setup note). */
export const MessageVariantListQuerySchema = z.object({
  templateId: MessageVariantTemplateIdSchema.optional(),
  /** Omit or `"issue"` for setup audience; otherwise `StakeholderGroup.id`. */
  lens: z.union([z.literal("issue"), z.string().uuid()]).optional(),
  history: z.enum(["1"]).optional(),
});
export type MessageVariantListQuery = z.infer<typeof MessageVariantListQuerySchema>;
