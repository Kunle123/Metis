import { z } from "zod";

import { GapSeveritySchema } from "./gap";
import { InternalInputConfidenceSchema } from "./internalInput";
import { SourceTierSchema } from "./source";

export const FollowUpTargetSchema = z.enum(["source", "open_question", "observation", "none"]);
export type FollowUpTarget = z.infer<typeof FollowUpTargetSchema>;

/** Open-question shaped suggestion (matches gap create fields intent; not persisted). */
export const SuggestedOpenQuestionExtractSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  whyItMatters: z.string().min(1),
  stakeholder: z.string().min(1),
  severity: GapSeveritySchema,
  linkedSection: z.string().nullable(),
  verbatimExcerpt: z.string().min(1),
  needsReview: z.literal(true),
});
export type SuggestedOpenQuestionExtract = z.infer<typeof SuggestedOpenQuestionExtractSchema>;

export const SuggestedSourceExtractSchema = z.object({
  title: z.string().min(1),
  note: z.string().min(1),
  snippet: z.string().nullable(),
  url: z.string().nullable(),
  suggestedTier: SourceTierSchema,
  linkedSection: z.string().nullable(),
  verbatimExcerpt: z.string().min(1),
  isVerifiedEvidence: z.literal(false),
  needsReview: z.literal(true),
});
export type SuggestedSourceExtract = z.infer<typeof SuggestedSourceExtractSchema>;

export const SuggestedObservationExtractSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
  response: z.string().min(1),
  confidence: InternalInputConfidenceSchema,
  linkedSection: z.string().nullable(),
  verbatimExcerpt: z.string().min(1),
  needsReview: z.literal(true),
});
export type SuggestedObservationExtract = z.infer<typeof SuggestedObservationExtractSchema>;

export const FollowUpActionExtractSchema = z.object({
  label: z.string().min(1),
  rationale: z.string().nullable(),
  suggestedTarget: FollowUpTargetSchema,
  verbatimExcerpt: z.string().min(1),
  needsReview: z.literal(true),
});
export type FollowUpActionExtract = z.infer<typeof FollowUpActionExtractSchema>;

export const CaptureNotesExtractResponseSchema = z.object({
  ok: z.literal(true),
  suggestedOpenQuestions: z.array(SuggestedOpenQuestionExtractSchema),
  suggestedSources: z.array(SuggestedSourceExtractSchema),
  suggestedObservations: z.array(SuggestedObservationExtractSchema),
  followUpActions: z.array(FollowUpActionExtractSchema),
  limitations: z.string(),
});
export type CaptureNotesExtractResponse = z.infer<typeof CaptureNotesExtractResponseSchema>;
