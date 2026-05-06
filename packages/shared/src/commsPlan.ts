import { z } from "zod";

import { BriefModeSchema } from "./briefVersion";
import { ExportFormatSchema } from "./export";
import { MessageVariantTemplateIdSchema } from "./messageVariant";

export const CommsPlanOutputTypeSchema = z.enum(["message", "brief", "export", "custom"]);
export type CommsPlanOutputType = z.infer<typeof CommsPlanOutputTypeSchema>;

export const CommsPlanScheduleTypeSchema = z.enum(["one_off", "cadence", "trigger"]);
export type CommsPlanScheduleType = z.infer<typeof CommsPlanScheduleTypeSchema>;

export const CommsPlanTriggerTypeSchema = z.enum([
  "manual",
  "on_approval",
  "on_confirmed_impact",
  "on_press_inquiry",
  "on_status_change",
]);
export type CommsPlanTriggerType = z.infer<typeof CommsPlanTriggerTypeSchema>;

export const CommsPlanStatusSchema = z.enum(["planned", "prepared", "sent", "skipped"]);
export type CommsPlanStatus = z.infer<typeof CommsPlanStatusSchema>;

export const CommsPlanItemSchema = z.object({
  id: z.string(),
  issueId: z.string(),
  stakeholderGroupId: z.string().uuid().nullable(),
  stakeholderGroupName: z.string().nullable().optional(),
  title: z.string(),
  outputType: CommsPlanOutputTypeSchema,
  messageTemplateId: MessageVariantTemplateIdSchema.nullable(),
  briefMode: BriefModeSchema.nullable(),
  exportFormat: ExportFormatSchema.nullable(),
  channel: z.string(),
  scheduleType: CommsPlanScheduleTypeSchema,
  cadenceMinutes: z.number().int().positive().nullable(),
  triggerType: CommsPlanTriggerTypeSchema.nullable(),
  nextDueAt: z.string().nullable(),
  owner: z.string().nullable(),
  status: CommsPlanStatusSchema,
  notes: z.string().nullable(),
  lastPreparedAt: z.string().nullable(),
  lastSentAt: z.string().nullable(),
  lastSkippedAt: z.string().nullable(),
  skipReason: z.string().nullable(),
  preparedFromMessageVariantId: z.string().uuid().nullable(),
  preparedFromBriefVersionId: z.string().uuid().nullable(),
  preparedFromExportId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CommsPlanItem = z.infer<typeof CommsPlanItemSchema>;

export const ListCommsPlanResponseSchema = z.object({
  items: z.array(CommsPlanItemSchema),
});
export type ListCommsPlanResponse = z.infer<typeof ListCommsPlanResponseSchema>;

export const CreateCommsPlanItemInputSchema = z
  .object({
    stakeholderGroupId: z.string().uuid().nullable().optional(),
    title: z.string().min(1),
    outputType: CommsPlanOutputTypeSchema,
    messageTemplateId: MessageVariantTemplateIdSchema.nullable().optional(),
    briefMode: BriefModeSchema.nullable().optional(),
    exportFormat: ExportFormatSchema.nullable().optional(),
    channel: z.string().min(1),
    scheduleType: CommsPlanScheduleTypeSchema,
    cadenceMinutes: z.number().int().positive().nullable().optional(),
    triggerType: CommsPlanTriggerTypeSchema.nullable().optional(),
    nextDueAt: z.string().datetime().nullable().optional(),
    owner: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.outputType === "message" && !v.messageTemplateId) {
      ctx.addIssue({ code: "custom", path: ["messageTemplateId"], message: "messageTemplateId is required for message outputType." });
    }
    if (v.outputType === "brief" && !v.briefMode) {
      ctx.addIssue({ code: "custom", path: ["briefMode"], message: "briefMode is required for brief outputType." });
    }
    if (v.outputType === "export" && !v.exportFormat) {
      ctx.addIssue({ code: "custom", path: ["exportFormat"], message: "exportFormat is required for export outputType." });
    }
    if (v.scheduleType === "cadence" && !v.cadenceMinutes) {
      ctx.addIssue({ code: "custom", path: ["cadenceMinutes"], message: "cadenceMinutes is required for cadence scheduleType." });
    }
    if (v.scheduleType === "trigger" && !v.triggerType) {
      ctx.addIssue({ code: "custom", path: ["triggerType"], message: "triggerType is required for trigger scheduleType." });
    }
  });
export type CreateCommsPlanItemInput = z.infer<typeof CreateCommsPlanItemInputSchema>;

export const UpdateCommsPlanItemInputSchema = z
  .object({
    stakeholderGroupId: z.string().uuid().nullable().optional(),
    title: z.string().min(1).optional(),
    outputType: CommsPlanOutputTypeSchema.optional(),
    messageTemplateId: MessageVariantTemplateIdSchema.nullable().optional(),
    briefMode: BriefModeSchema.nullable().optional(),
    exportFormat: ExportFormatSchema.nullable().optional(),
    channel: z.string().min(1).optional(),
    scheduleType: CommsPlanScheduleTypeSchema.optional(),
    cadenceMinutes: z.number().int().positive().nullable().optional(),
    triggerType: CommsPlanTriggerTypeSchema.nullable().optional(),
    nextDueAt: z.string().datetime().nullable().optional(),
    owner: z.string().nullable().optional(),
    status: CommsPlanStatusSchema.optional(),
    notes: z.string().nullable().optional(),
    skipReason: z.string().nullable().optional(),
    preparedFromMessageVariantId: z.string().uuid().nullable().optional(),
    preparedFromBriefVersionId: z.string().uuid().nullable().optional(),
    preparedFromExportId: z.string().uuid().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "skipped") {
      const reason = (v.skipReason ?? "").trim();
      if (!reason) {
        ctx.addIssue({ code: "custom", path: ["skipReason"], message: "skipReason is required when status is skipped." });
      }
    }
  });
export type UpdateCommsPlanItemInput = z.infer<typeof UpdateCommsPlanItemInputSchema>;

