import type {
  IssueHistoryEventCard,
  IssueHistoryGroupedRecordItem,
  IssueHistoryGroupedRecordKind,
  IssueHistoryImpactSummary,
} from "./issueHistoryTypes";

export type RecordAdditionGroupingContext = {
  /** claimId → internalInputId when claim was linked from an incoming update */
  claimInputByClaimId: Map<string, string>;
};

export function isRecordAdditionEvent(card: IssueHistoryEventCard): boolean {
  if (card.lane !== "issue_record") return false;
  return card.id.startsWith("source:") || card.id.startsWith("claim:") || card.id.startsWith("gap:");
}

function modalTypeToKind(modalType: string): IssueHistoryGroupedRecordKind {
  if (modalType === "source") return "source";
  if (modalType === "claim") return "claim";
  if (modalType === "gap") return "question";
  return "source";
}

function plural(count: number, singular: string, pluralForm?: string): string {
  if (count === 1) return `1 ${singular}`;
  return `${count} ${pluralForm ?? `${singular}s`}`;
}

export function formatGroupedRecordTypeCounts(summary: IssueHistoryImpactSummary): string {
  const parts: string[] = [];
  if (summary.sourcesLinked) parts.push(plural(summary.sourcesLinked, "source"));
  if (summary.claimsAdded) parts.push(plural(summary.claimsAdded, "claim"));
  if (summary.questionsOpened) parts.push(plural(summary.questionsOpened, "open question", "open questions"));
  if (summary.observationsAdded) parts.push(plural(summary.observationsAdded, "observation"));
  return parts.join(" · ");
}

function impactFromMembers(members: IssueHistoryEventCard[]): IssueHistoryImpactSummary {
  const summary: IssueHistoryImpactSummary = {};
  for (const m of members) {
    switch (m.modalType) {
      case "source":
        summary.sourcesLinked = (summary.sourcesLinked ?? 0) + 1;
        break;
      case "claim":
        summary.claimsAdded = (summary.claimsAdded ?? 0) + 1;
        break;
      case "gap":
        summary.questionsOpened = (summary.questionsOpened ?? 0) + 1;
        break;
      default:
        break;
    }
  }
  return summary;
}

function extractCodeFromSubtitle(subtitle?: string): string | undefined {
  if (!subtitle) return undefined;
  const code = subtitle.split("·")[0]?.trim();
  return code && code.length <= 12 ? code : undefined;
}

function groupedRecordsFromMembers(members: IssueHistoryEventCard[]): IssueHistoryGroupedRecordItem[] {
  const typeOrder: IssueHistoryGroupedRecordKind[] = ["source", "claim", "question", "observation"];
  const sorted = [...members].sort((a, b) => {
    const ai = typeOrder.indexOf(modalTypeToKind(a.modalType));
    const bi = typeOrder.indexOf(modalTypeToKind(b.modalType));
    if (ai !== bi) return ai - bi;
    return members.indexOf(a) - members.indexOf(b);
  });

  return sorted.map((m) => ({
    kind: modalTypeToKind(m.modalType),
    id: m.linkedRecordId,
    title: m.title,
    code: extractCodeFromSubtitle(m.subtitle),
  }));
}

/** Resolve action anchors: timestamp → internalInputId from record-update / incoming cards. */
function buildActionAnchorsByTimestamp(events: IssueHistoryEventCard[]): Map<string, string> {
  const anchors = new Map<string, string>();

  for (const e of events) {
    if (e.modalType === "issue_record_update" && e.linkedRecordId.endsWith("::issue_record_update")) {
      const inputId = e.linkedRecordId.replace(/::issue_record_update$/, "");
      anchors.set(e.timestamp, inputId);
    }
  }

  for (const e of events) {
    if (e.modalType !== "incoming_update" || e.linkedRecordType !== "InternalInput") continue;
    if (!anchors.has(e.timestamp)) {
      anchors.set(e.timestamp, e.linkedRecordId);
    }
  }

  return anchors;
}

function resolveGroupKey(
  card: IssueHistoryEventCard,
  actionAnchorsByTimestamp: Map<string, string>,
  ctx: RecordAdditionGroupingContext,
): string | null {
  if (card.batchKey) return `batch:${card.batchKey}`;

  const actionInputId = actionAnchorsByTimestamp.get(card.timestamp);
  if (actionInputId) {
    return `action:input:${actionInputId}`;
  }

  if (card.modalType === "claim") {
    const inputId = ctx.claimInputByClaimId.get(card.linkedRecordId);
    if (inputId) return `action:input:${inputId}`;
  }

  return null;
}

export function buildRecordsAddedGroupCard(
  members: IssueHistoryEventCard[],
  groupKey: string,
  row: (
    timestamp: string,
    partial: Omit<IssueHistoryEventCard, "timestamp" | "displayTime" | "day" | "time">,
  ) => IssueHistoryEventCard,
): IssueHistoryEventCard {
  const first = members[0]!;
  const impactSummary = impactFromMembers(members);
  const groupedRecords = groupedRecordsFromMembers(members);
  const total = members.length;

  return row(first.timestamp, {
    id: `records-added:${groupKey}`,
    lane: "issue_record",
    title: total === 1 ? members[0]!.title : "Records added",
    subtitle: total === 1 ? members[0]!.subtitle : formatGroupedRecordTypeCounts(impactSummary),
    badge: total === 1 ? members[0]!.badge : "RECORDS ADDED",
    linkedRecordType: "records_added_group",
    linkedRecordId: groupKey,
    relatedRecordIds: members.map((m) => m.linkedRecordId),
    modalType: "records_added_group",
    impactSummary,
    groupedRecords,
    batchKey: members.find((m) => m.batchKey)?.batchKey,
  });
}

/**
 * Combine same-action record additions into grouped timeline cards.
 * Single additions remain as individual cards.
 */
export function groupIssueHistoryRecordAdditions(
  events: IssueHistoryEventCard[],
  ctx: RecordAdditionGroupingContext,
  row: (
    timestamp: string,
    partial: Omit<IssueHistoryEventCard, "timestamp" | "displayTime" | "day" | "time">,
  ) => IssueHistoryEventCard,
): IssueHistoryEventCard[] {
  const actionAnchorsByTimestamp = buildActionAnchorsByTimestamp(events);
  const additions = events.filter(isRecordAdditionEvent);
  const nonAdditions = events.filter((e) => !isRecordAdditionEvent(e));

  const actionGroups = new Map<string, IssueHistoryEventCard[]>();
  const timestampOnlyPool: IssueHistoryEventCard[] = [];

  for (const card of additions) {
    const key = resolveGroupKey(card, actionAnchorsByTimestamp, ctx);
    if (key) {
      const list = actionGroups.get(key) ?? [];
      list.push(card);
      actionGroups.set(key, list);
    } else {
      timestampOnlyPool.push(card);
    }
  }

  const timestampGroups = new Map<string, IssueHistoryEventCard[]>();
  for (const card of timestampOnlyPool) {
    const list = timestampGroups.get(card.timestamp) ?? [];
    list.push(card);
    timestampGroups.set(card.timestamp, list);
  }

  const groupedCards: IssueHistoryEventCard[] = [];
  const singletons: IssueHistoryEventCard[] = [];

  for (const [key, members] of actionGroups) {
    if (members.length >= 2) {
      groupedCards.push(buildRecordsAddedGroupCard(members, key, row));
    } else {
      singletons.push(members[0]!);
    }
  }

  for (const [ts, members] of timestampGroups) {
    if (members.length >= 2) {
      groupedCards.push(buildRecordsAddedGroupCard(members, `ts:${ts}`, row));
    } else {
      singletons.push(members[0]!);
    }
  }

  return [...nonAdditions, ...singletons, ...groupedCards].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp),
  );
}
