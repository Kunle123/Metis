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

export const ExportPackageResponseSchema = z.object({
  issueId: z.string(),
  briefVersionId: z.string(),
  mode: BriefModeSchema,
  format: ExportFormatSchema,
  title: z.string(),
  generatedAt: z.string(),
  filename: z.string(),
  mimeType: z.union([z.literal("text/markdown"), z.literal("text/plain")]),
  content: z.string(),
  circulationState: CirculationStateSchema,
  circulationNotes: z.string().nullable(),
});
export type ExportPackageResponse = z.infer<typeof ExportPackageResponseSchema>;

