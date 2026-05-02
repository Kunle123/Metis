import { z } from "zod";

import { BriefModeSchema } from "./briefVersion";
import { CirculationStateSchema } from "./compare";
import { ExportFormatSchema, ExportOutputTypeSchema } from "./export";

export const CirculationEventTypeSchema = z.union([
  z.literal("prepared"),
  z.literal("downloaded"),
  z.literal("copied"),
  z.literal("sent"),
]);
export type CirculationEventType = z.infer<typeof CirculationEventTypeSchema>;

export const CirculationChannelSchema = z.union([z.literal("file"), z.literal("copy"), z.literal("email"), z.literal("link")]);
export type CirculationChannel = z.infer<typeof CirculationChannelSchema>;

export const CreateArtifactExportInputSchema = z
  .object({
    briefVersionId: z.string(),
    format: ExportFormatSchema,
    /** Defaults to `markdown` when omitted (existing clients). Ignored when `format` is `email-ready`. */
    outputType: ExportOutputTypeSchema.optional(),
    /**
     * Optional: allow the Export UI to log an event alongside export creation.
     * This avoids any implied workflow automation while keeping auditability durable.
     */
    logEvent: z
      .object({
        eventType: CirculationEventTypeSchema,
        channel: CirculationChannelSchema.optional(),
        actorLabel: z.string().nullable().optional(),
        audienceLabel: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
      })
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.format === "email-ready" && val.outputType === "html") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "HTML output is not available for email-ready format" });
    }
    if (val.outputType === "plain" && val.format !== "email-ready") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plain output applies only to email-ready format" });
    }
  });
export type CreateArtifactExportInput = z.infer<typeof CreateArtifactExportInputSchema>;

export const ArtifactExportResponseSchema = z.object({
  exportId: z.string(),
  issueId: z.string(),
  briefVersionId: z.string(),
  mode: BriefModeSchema,
  format: ExportFormatSchema,
  outputType: ExportOutputTypeSchema.optional(),
  filename: z.string(),
  mimeType: z.union([z.literal("text/markdown"), z.literal("text/plain"), z.literal("text/html")]),
  content: z.string(),
  createdAt: z.string(),
});
export type ArtifactExportResponse = z.infer<typeof ArtifactExportResponseSchema>;

export const CreateCirculationEventInputSchema = z.object({
  briefVersionId: z.string(),
  exportId: z.string().nullable().optional(),
  actorLabel: z.string().nullable().optional(),
  eventType: CirculationEventTypeSchema,
  channel: CirculationChannelSchema.nullable().optional(),
  audienceLabel: z.string().nullable().optional(),
  postureState: CirculationStateSchema,
  note: z.string().nullable().optional(),
});
export type CreateCirculationEventInput = z.infer<typeof CreateCirculationEventInputSchema>;

export const CirculationEventResponseSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  briefVersionId: z.string(),
  exportId: z.string().nullable(),
  actorLabel: z.string().nullable(),
  eventType: CirculationEventTypeSchema,
  channel: CirculationChannelSchema.nullable(),
  audienceLabel: z.string().nullable(),
  postureState: CirculationStateSchema,
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type CirculationEventResponse = z.infer<typeof CirculationEventResponseSchema>;

