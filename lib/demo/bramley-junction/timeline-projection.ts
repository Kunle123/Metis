import { bramleyIncomingUpdates } from "./incoming-inputs";
import { bramleyOutputs } from "./outputs";
import type { BramleyTimelineItem } from "./types";
import { BRAMLEY_COMPARISON_ID, BRAMLEY_ISSUE_ID } from "./ids";
import { bramleyIso, bramleyLabelFromAt } from "./timestamps";

function sortByTime(items: BramleyTimelineItem[]): BramleyTimelineItem[] {
  return [...items].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function timelineRow(
  timestamp: string,
  partial: Omit<BramleyTimelineItem, "timestamp" | "displayTime">,
): BramleyTimelineItem {
  return {
    timestamp,
    displayTime: bramleyLabelFromAt(timestamp),
    ...partial,
  };
}

/** When the update entered the Metis issue record — never the underlying operational event time. */
function incomingCardTimestamp(input: (typeof bramleyIncomingUpdates)[number]): string {
  return input.addedToMetisAt;
}

function incomingUpdateSubtitle(input: (typeof bramleyIncomingUpdates)[number]): string {
  return `${input.senderTeam} · ${input.channel}`;
}

function hasAnyImpact(input: (typeof bramleyIncomingUpdates)[number]): boolean {
  const i = input.issueRecordImpacts;
  return Boolean(
    (i.claimsAdded?.length ?? 0) > 0 ||
      (i.gapsOpened?.length ?? 0) > 0 ||
      (i.gapsClosed?.length ?? 0) > 0 ||
      (i.observationsAdded?.length ?? 0) > 0 ||
      Boolean(i.statusNote) ||
      Boolean(input.linkedSourceId),
  );
}

function impactSubtitle(input: (typeof bramleyIncomingUpdates)[number]): string {
  const i = input.issueRecordImpacts;
  const claims = i.claimsAdded?.length ?? 0;
  const opened = i.gapsOpened?.length ?? 0;
  const closed = i.gapsClosed?.length ?? 0;
  const obs = i.observationsAdded?.length ?? 0;

  const parts: string[] = [];
  if (claims) parts.push(`+${claims} claims`);
  if (opened) parts.push(`+${opened} open questions`);
  if (obs) parts.push(`+${obs} observations`);
  if (closed) parts.push(`${closed} questions closed`);
  if (i.statusNote) parts.push("status updated");

  return parts.length ? parts.join(" · ") : "Issue record updated";
}

export function buildBramleyTimelineProjection(): BramleyTimelineItem[] {
  const items: BramleyTimelineItem[] = [];

  for (const input of bramleyIncomingUpdates) {
    items.push(
      timelineRow(incomingCardTimestamp(input), {
        lane: "incoming_update",
        title: input.title,
        subtitle: incomingUpdateSubtitle(input),
        badge: input.inputType,
        linkedRecordType: "incoming_update",
        linkedRecordId: input.id,
        relatedRecordIds: [
          ...(input.linkedSourceId ? [input.linkedSourceId] : []),
          ...(input.issueRecordImpacts.claimsAdded ?? []),
          ...(input.issueRecordImpacts.gapsOpened ?? []),
          ...(input.issueRecordImpacts.gapsClosed ?? []),
          ...(input.issueRecordImpacts.observationsAdded ?? []),
        ],
        intake: {
          reportedEventAt: input.eventOccurredAt,
          sourceTimestamp: input.sourceTimestamp,
          receivedByCommsAt: input.receivedByCommsAt,
          addedToMetisAt: input.addedToMetisAt,
          intakeRoute: input.intakeRoute,
        },
      }),
    );

    if (hasAnyImpact(input)) {
      const i = input.issueRecordImpacts;
      const claimsAdded = i.claimsAdded ?? [];
      const gapsOpened = i.gapsOpened ?? [];
      const gapsClosed = i.gapsClosed ?? [];
      const observationsAdded = i.observationsAdded ?? [];
      const statusNote = i.statusNote ?? null;

      items.push(
        timelineRow(input.addedToMetisAt, {
          lane: "issue_record",
          title: `Issue record updated from ${input.suggestedTimelineLabel || input.title}`,
          subtitle: impactSubtitle(input),
          badge: "RECORD UPDATED",
          linkedRecordType: "issue_record_update",
          linkedRecordId: `${input.id}::issue_record_update`,
          relatedRecordIds: [
            ...(input.linkedSourceId ? [input.linkedSourceId] : []),
            ...claimsAdded,
            ...gapsOpened,
            ...gapsClosed,
            ...observationsAdded,
          ],
          impact: {
            linkedSourceId: input.linkedSourceId,
            claimsAdded,
            gapsOpened,
            gapsClosed,
            observationsAdded,
            statusNote,
          },
        }),
      );
    }
  }

  const milestones: Array<{ at: string; label: string }> = [
    { at: "2026-05-11T05:42:00", label: "Comms engaged — issue opened in Metis" },
    { at: "2026-05-11T05:48:00", label: "Managed operational disruption" },
    { at: "2026-05-11T07:12:00", label: "Reopening expected shortly" },
    { at: "2026-05-11T08:12:00", label: "Operational disruption closed" },
    { at: "2026-05-11T09:00:00", label: "Review / audit stage" },
  ];
  for (const m of milestones) {
    items.push(
      timelineRow(bramleyIso(m.at), {
        lane: "issue_record",
        title: "Issue status",
        subtitle: m.label,
        badge: "DECISION",
        linkedRecordType: "issue",
        linkedRecordId: BRAMLEY_ISSUE_ID,
        relatedRecordIds: [],
      }),
    );
  }

  items.push(
    timelineRow(bramleyIso("2026-05-11T06:40:00"), {
      lane: "issue_record",
      title: "Compare executive brief versions",
      subtitle: "V1 → V2 after reopening evidence",
      badge: "COMPARE",
      linkedRecordType: "brief_comparison",
      linkedRecordId: BRAMLEY_COMPARISON_ID,
      relatedRecordIds: [],
    }),
  );

  for (const output of bramleyOutputs) {
    items.push(
      timelineRow(output.generatedAt, {
        lane: "metis_output",
        title: output.title,
        subtitle: `${output.audience} · ${output.status}`,
        badge: output.kind.replace(/_/g, " ").toUpperCase(),
        linkedRecordType: "output",
        linkedRecordId: output.id,
        relatedRecordIds: [...output.linkedSourceIds, ...output.linkedClaimIds],
      }),
    );
  }

  return sortByTime(items);
}
