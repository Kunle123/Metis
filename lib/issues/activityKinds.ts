import { IssueActivityKindSchema } from "@metis/shared/activity";

export const IssueActivityKinds = {
  issue_created: IssueActivityKindSchema.parse("issue_created"),
  issue_triage_updated: IssueActivityKindSchema.parse("issue_triage_updated"),
  brief_version_created: IssueActivityKindSchema.parse("brief_version_created"),
  gap_created: IssueActivityKindSchema.parse("gap_created"),
  gap_resolved: IssueActivityKindSchema.parse("gap_resolved"),
  gap_reopened: IssueActivityKindSchema.parse("gap_reopened"),
  internal_input_created: IssueActivityKindSchema.parse("internal_input_created"),
  source_created: IssueActivityKindSchema.parse("source_created"),
  export_created: IssueActivityKindSchema.parse("export_created"),
  export_approval_updated: IssueActivityKindSchema.parse("export_approval_updated"),
  circulation_event_created: IssueActivityKindSchema.parse("circulation_event_created"),
  message_variant_created: IssueActivityKindSchema.parse("message_variant_created"),
  message_variant_approval_updated: IssueActivityKindSchema.parse("message_variant_approval_updated"),
  comms_plan_item_created: IssueActivityKindSchema.parse("comms_plan_item_created"),
  comms_plan_item_updated: IssueActivityKindSchema.parse("comms_plan_item_updated"),
  comms_plan_item_prepared: IssueActivityKindSchema.parse("comms_plan_item_prepared"),
  comms_plan_item_sent: IssueActivityKindSchema.parse("comms_plan_item_sent"),
  comms_plan_item_skipped: IssueActivityKindSchema.parse("comms_plan_item_skipped"),
  claim_created: IssueActivityKindSchema.parse("claim_created"),
  claim_updated: IssueActivityKindSchema.parse("claim_updated"),
  claim_status_updated: IssueActivityKindSchema.parse("claim_status_updated"),
} as const;

