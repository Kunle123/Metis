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
    lensSource: z.union([z.literal("issue_stakeholder"), z.literal("issue_audience_only")]),
    issueLevelAudienceNote: z.string().nullable(),
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
  issueStakeholderId: z.string().nullable(),
  audienceSnapshot: z.record(z.string(), z.unknown()),
  artifact: MessageVariantArtifactSchema,
  createdAt: z.string(),
});
export type MessageVariantRecord = z.infer<typeof MessageVariantRecordSchema>;

export const CreateMessageVariantInputSchema = z.object({
  templateId: MessageVariantTemplateIdSchema,
  issueStakeholderId: z.string().uuid().nullable().optional(),
});
export type CreateMessageVariantInput = z.infer<typeof CreateMessageVariantInputSchema>;
