import { northbankCirculationEvents } from "./circulation";
import { northbankIncomingUpdates } from "./incoming-inputs";
import { northbankOutputs } from "./outputs";
import type { NorthbankTimelineItem } from "./types";
import { NORTHBANK_COMPARISON_ID, NORTHBANK_ISSUE_ID } from "./ids";
import { northbankIso, northbankLabelFromAt } from "./timestamps";

function sortByTime(items: NorthbankTimelineItem[]): NorthbankTimelineItem[] {
  return [...items].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function eventOccurredClockLabel(isoUtc: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoUtc));
}

function timelineRow(
  timestamp: string,
  partial: Omit<NorthbankTimelineItem, "timestamp" | "displayTime">,
): NorthbankTimelineItem {
  return {
    timestamp,
    displayTime: northbankLabelFromAt(timestamp),
    ...partial,
  };
}

function incomingUpdateSubtitle(input: (typeof northbankIncomingUpdates)[number]): string {
  if (input.intakeRoute === "reconstructed_from_project_source") {
    return `Added from project source · event occurred ${eventOccurredClockLabel(input.eventOccurredAt)}`;
  }
  const received =
    input.receivedByCommsAt != null &&
    input.receivedByCommsAt !== input.eventOccurredAt
      ? ` · received ${eventOccurredClockLabel(input.receivedByCommsAt)}`
      : "";
  return `${input.senderTeam} · ${input.channel} · Direct to comms${received}`;
}

function hasAnyImpact(input: (typeof northbankIncomingUpdates)[number]): boolean {
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

function impactSubtitle(input: (typeof northbankIncomingUpdates)[number]): string {
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

export function buildNorthbankTimelineProjection(): NorthbankTimelineItem[] {
  const items: NorthbankTimelineItem[] = [];

  for (const input of northbankIncomingUpdates) {
    items.push(
      timelineRow(input.addedToMetisAt, {
        lane: "incoming_update",
        title: input.title,
        subtitle: incomingUpdateSubtitle(input),
        badge: input.inputType,
        status: input.intakeRoute === "direct_to_comms" ? "Received" : "Logged",
        linkedRecordType: "incoming_update",
        linkedRecordId: input.id,
        relatedRecordIds: [
          ...(input.linkedSourceId ? [input.linkedSourceId] : []),
          ...(input.issueRecordImpacts.claimsAdded ?? []),
          ...(input.issueRecordImpacts.gapsOpened ?? []),
          ...(input.issueRecordImpacts.gapsClosed ?? []),
          ...(input.issueRecordImpacts.observationsAdded ?? []),
        ],
        modalType: "incoming_update",
        intake: {
          eventOccurredAt: input.eventOccurredAt,
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
          status: statusNote ?? "Updated",
          linkedRecordType: "issue_record_update",
          linkedRecordId: `${input.id}::issue_record_update`,
          relatedRecordIds: [
            ...(input.linkedSourceId ? [input.linkedSourceId] : []),
            ...claimsAdded,
            ...gapsOpened,
            ...gapsClosed,
            ...observationsAdded,
          ],
          modalType: "issue_record_update",
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
    { at: "2026-06-08T11:00:00", label: "Launch readiness issue opened" },
    { at: "2026-06-15T11:15:00", label: "Executive readiness brief requested" },
    { at: "2026-06-18T11:45:00", label: "Pricing and eligibility approved" },
    { at: "2026-06-19T09:00:00", label: "Launch approved for announcement" },
    { at: "2026-06-19T11:15:00", label: "Circulation audit recorded" },
  ];
  for (const m of milestones) {
    items.push(
      timelineRow(northbankIso(m.at), {
        lane: "issue_record",
        title: "Issue status",
        subtitle: m.label,
        badge: "DECISION",
        status: m.label,
        linkedRecordType: "issue",
        linkedRecordId: NORTHBANK_ISSUE_ID,
        relatedRecordIds: [],
        modalType: "issue_status",
      }),
    );
  }

  items.push(
    timelineRow(northbankIso("2026-06-18T12:20:00"), {
      lane: "issue_record",
      title: "Compare executive brief versions",
      subtitle: "V1 → V2 after pricing and digital approvals",
      badge: "COMPARE",
      status: "Ready",
      linkedRecordType: "brief_comparison",
      linkedRecordId: NORTHBANK_COMPARISON_ID,
      relatedRecordIds: [],
      modalType: "brief_comparison",
    }),
  );

  for (const event of northbankCirculationEvents) {
    items.push(
      timelineRow(event.at, {
        lane: "issue_record",
        title: `Circulation · ${event.eventType}`,
        subtitle: event.note ?? event.channel ?? event.audienceLabel ?? "",
        badge: "CIRCULATION",
        status: event.postureState,
        linkedRecordType: "circulation",
        linkedRecordId: event.id,
        relatedRecordIds: event.outputId ? [event.outputId] : [],
        modalType: "circulation",
      }),
    );
  }

  for (const output of northbankOutputs) {
    items.push(
      timelineRow(output.generatedAt, {
        lane: "metis_output",
        title: output.title,
        subtitle: `${output.audience} · ${output.status}`,
        badge: output.kind.replace(/_/g, " ").toUpperCase(),
        status: output.status,
        linkedRecordType: "output",
        linkedRecordId: output.id,
        relatedRecordIds: [...output.linkedSourceIds, ...output.linkedClaimIds],
        modalType: "output",
      }),
    );
  }

  return sortByTime(items);
}
