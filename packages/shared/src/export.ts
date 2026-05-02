import { z } from "zod";

import { BriefModeSchema } from "./briefVersion";
import { CirculationStateSchema } from "./compare";

export const ExportFormatSchema = z.union([
  z.literal("full-issue-brief"),
  z.literal("executive-brief"),
  z.literal("board-note"),
  z.literal("email-ready"),
]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

/** Delivery encoding; logical brief package stays in `ExportFormat`. */
export const ExportOutputTypeSchema = z.union([z.literal("markdown"), z.literal("plain"), z.literal("html")]);
export type ExportOutputType = z.infer<typeof ExportOutputTypeSchema>;

export const ExportMimeTypeSchema = z.union([
  z.literal("text/markdown"),
  z.literal("text/plain"),
  z.literal("text/html"),
]);

export const ExportPackageResponseSchema = z.object({
  issueId: z.string(),
  briefVersionId: z.string(),
  mode: BriefModeSchema,
  format: ExportFormatSchema,
  outputType: ExportOutputTypeSchema.optional(),
  title: z.string(),
  generatedAt: z.string(),
  filename: z.string(),
  mimeType: ExportMimeTypeSchema,
  content: z.string(),
  circulationState: CirculationStateSchema,
  circulationNotes: z.string().nullable(),
});
export type ExportPackageResponse = z.infer<typeof ExportPackageResponseSchema>;

