import { z } from "zod";

export const IssuePrioritySchema = z.union([z.literal("Critical"), z.literal("High"), z.literal("Normal"), z.literal("Low")]);
export type IssuePriority = z.infer<typeof IssuePrioritySchema>;

export const OperatorPostureSchema = z.union([z.literal("Monitoring"), z.literal("Active"), z.literal("Holding"), z.literal("Closed")]);
export type OperatorPosture = z.infer<typeof OperatorPostureSchema>;

export const IssueActivityKindSchema = z.union([
  z.literal("issue_created"),
  z.literal("issue_triage_updated"),
  z.literal("brief_version_created"),
  z.literal("gap_created"),
  z.literal("gap_resolved"),
  z.literal("gap_reopened"),
  z.literal("internal_input_created"),
  z.literal("source_created"),
  z.literal("export_created"),
  z.literal("circulation_event_created"),
  z.literal("message_variant_created"),
  z.literal("comms_plan_item_created"),
  z.literal("comms_plan_item_updated"),
  z.literal("comms_plan_item_prepared"),
  z.literal("comms_plan_item_sent"),
  z.literal("comms_plan_item_skipped"),
]);
export type IssueActivityKind = z.infer<typeof IssueActivityKindSchema>;

export const IssueActivitySchema = z.object({
  id: z.string(),
  issueId: z.string(),
  kind: IssueActivityKindSchema,
  summary: z.string(),
  refType: z.string().nullable(),
  refId: z.string().nullable(),
  actorLabel: z.string().nullable(),
  createdAt: z.string(),
});
export type IssueActivity = z.infer<typeof IssueActivitySchema>;

export const ListIssueActivityResponseSchema = z.object({
  items: z.array(IssueActivitySchema),
});
export type ListIssueActivityResponse = z.infer<typeof ListIssueActivityResponseSchema>;

export const PatchIssueTriageInputSchema = z.object({
  priority: IssuePrioritySchema.optional(),
  operatorPosture: OperatorPostureSchema.optional(),
});
export type PatchIssueTriageInput = z.infer<typeof PatchIssueTriageInputSchema>;

