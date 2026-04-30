import { z } from "zod";

export const MessageVariantTemplateIdSchema = z.enum([
  "external_customer_resident_student",
  "internal_staff_update",
  "media_holding_line",
]);
export type MessageVariantTemplateId = z.infer<typeof MessageVariantTemplateIdSchema>;

export const MessageVariantSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
});
export type MessageVariantSection = z.infer<typeof MessageVariantSectionSchema>;

/** How body text was produced for Messages (optional for older stored artifacts). */
export const MessageVariantWordingPolishSchema = z.enum(["deterministic_only", "ai_polished"]);
export type MessageVariantWordingPolish = z.infer<typeof MessageVariantWordingPolishSchema>;

/**
 * Optional back-compat fields to support comparing deterministic vs AI-enhanced copy.
 * Stored inside the artifact JSON so we avoid DB schema changes.
 */
const DeterministicSectionBodiesByIdSchema = z.record(z.string(), z.string());

const CommonArtifactMetadataSchema = z.object({
  publicHeadline: z.string(),
  lastRevisionLabel: z.string(),
  openGapsLabel: z.string(),
  audienceLabel: z.string(),
  lensSource: z.union([z.literal("issue_stakeholder"), z.literal("issue_audience_only"), z.literal("stakeholder_group")]),
  issueLevelAudienceNote: z.string().nullable(),
  /** Present when using an organisation audience group. */
  stakeholderGroupId: z.string().uuid().nullable().optional(),
  /** True when IssueStakeholder row supplied audience overlay fields used in copy (legacy linkage). */
  issueSpecificLensApplied: z.boolean().optional(),
  /** e.g. defaults-only message when no IssueStakeholder row. */
  lensEnrichmentNote: z.string().nullable().optional(),
  /** Set when Messages optional AI wording pass runs; omit on older deterministic-only rows. */
  aiWordingPolish: MessageVariantWordingPolishSchema.optional(),
  /** True when both deterministic + AI-enhanced bodies are stored for comparison. */
  aiComparisonAvailable: z.boolean().optional(),
  /** Snapshot of deterministic section bodies keyed by section id (present when aiComparisonAvailable). */
  deterministicSectionBodiesById: DeterministicSectionBodiesByIdSchema.optional(),
});

const GuardrailsSchema = z.object({
  mustAvoid: z.array(z.string()),
  toneNotes: z.string(),
});

export const ExternalCustomerResidentStudentArtifactSchema = z.object({
  templateId: z.literal("external_customer_resident_student"),
  metadata: CommonArtifactMetadataSchema,
  sections: z.array(MessageVariantSectionSchema),
  guardrails: GuardrailsSchema,
});
export type ExternalCustomerResidentStudentArtifact = z.infer<typeof ExternalCustomerResidentStudentArtifactSchema>;

export const InternalStaffUpdateArtifactSchema = z.object({
  templateId: z.literal("internal_staff_update"),
  metadata: CommonArtifactMetadataSchema.extend({
    /** Explicit internal-only caution for observations/evidence. */
    internalNotesLabel: z.string().optional(),
  }),
  sections: z.array(MessageVariantSectionSchema),
  guardrails: GuardrailsSchema,
});
export type InternalStaffUpdateArtifact = z.infer<typeof InternalStaffUpdateArtifactSchema>;

export const MediaHoldingLineArtifactSchema = z.object({
  templateId: z.literal("media_holding_line"),
  metadata: CommonArtifactMetadataSchema,
  sections: z.array(MessageVariantSectionSchema),
  guardrails: GuardrailsSchema,
});
export type MediaHoldingLineArtifact = z.infer<typeof MediaHoldingLineArtifactSchema>;

export const MessageVariantArtifactSchema = z.discriminatedUnion("templateId", [
  ExternalCustomerResidentStudentArtifactSchema,
  InternalStaffUpdateArtifactSchema,
  MediaHoldingLineArtifactSchema,
]);
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
  /** Requires server-side MESSAGES_AI_CLEANUP_ENABLED and OPENAI; otherwise deterministic only. */
  improveWithAi: z.boolean().optional(),
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
