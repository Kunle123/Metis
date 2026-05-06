/** Shared labels/formatting for issue activity timeline (server + client). */

export type SerializedActivityRow = {
  id: string;
  kind: string;
  summary: string;
  refType: string | null;
  refId: string | null;
  actorLabel: string | null;
  createdAt: string;
};

/** Activity row with optional join-derived headline (issue activity page). */
export type ActivityTimelineItem = SerializedActivityRow & {
  enrichedSummary?: string | null;
};

export const ACTIVITY_KIND_LABELS: Record<string, string> = {
  issue_created: "Issue · created",
  issue_triage_updated: "Issue · triage updated",
  brief_version_created: "Brief · new version",
  gap_created: "Open question · added",
  gap_resolved: "Open question · answered",
  gap_reopened: "Open question · reopened",
  internal_input_created: "Observation · added",
  source_created: "Source · added",
  export_created: "Export · created",
  circulation_event_created: "Circulation · logged",
  message_variant_created: "Message · generated",
  comms_plan_item_created: "Comms plan · added",
  comms_plan_item_updated: "Comms plan · updated",
  comms_plan_item_prepared: "Comms plan · marked prepared",
  comms_plan_item_sent: "Comms plan · marked sent",
  comms_plan_item_skipped: "Comms plan · skipped",
};

export function formatActivityTimestamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function activityKindLabel(kind: string) {
  return ACTIVITY_KIND_LABELS[kind] ?? kind.replaceAll("_", " ");
}

export function activityDisplaySummary(kind: string, summary: string) {
  if (kind === "gap_created" && summary === "Gap created") return "Open question added";
  if (kind === "gap_resolved" && summary === "Gap resolved") return "Open question answered";
  if (kind === "gap_reopened" && summary === "Gap reopened") return "Open question reopened";
  return summary;
}

/** Prefer join-based `enrichedSummary` when present; otherwise legacy/summary rules. */
export function activityTimelineDisplaySummary(row: ActivityTimelineItem): string {
  const trimmed = row.enrichedSummary?.trim();
  if (trimmed) return trimmed;
  return activityDisplaySummary(row.kind, row.summary);
}

export function activityDisplayRefType(refType: string | null) {
  if (!refType) return "Ref";
  if (refType === "Gap") return "Open question";
  return refType;
}

export function shortActivityRefId(id: string) {
  const t = id.trim();
  if (t.length <= 8) return t;
  return `…${t.slice(-8)}`;
}

export function activitySearchBlob(row: ActivityTimelineItem): string {
  const display = activityTimelineDisplaySummary(row);
  const parts = [
    activityKindLabel(row.kind),
    row.kind,
    display,
    activityDisplaySummary(row.kind, row.summary),
    row.summary,
    row.enrichedSummary ?? "",
    row.actorLabel ?? "",
    row.refType ?? "",
    row.refId ?? "",
    formatActivityTimestamp(row.createdAt),
  ];
  return parts.join(" ").toLowerCase();
}
