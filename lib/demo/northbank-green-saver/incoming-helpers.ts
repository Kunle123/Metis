import type { NorthbankIncomingUpdate, NorthbankIntakeRoute } from "./types";
import { northbankIso } from "./timestamps";

type IncomingBase = Pick<
  NorthbankIncomingUpdate,
  | "id"
  | "inputType"
  | "title"
  | "senderTeam"
  | "channel"
  | "summary"
  | "fullText"
  | "suggestedTimelineLabel"
  | "becomesSource"
  | "linkedSourceId"
  | "issueRecordImpacts"
>;

function build(
  base: IncomingBase,
  timing: {
    eventOccurredAt: string;
    sourceTimestamp: string;
    receivedByCommsAt: string | null;
    addedToMetisAt: string;
    intakeRoute: NorthbankIntakeRoute;
  },
): NorthbankIncomingUpdate {
  return {
    ...base,
    eventOccurredAt: northbankIso(timing.eventOccurredAt),
    sourceTimestamp: northbankIso(timing.sourceTimestamp),
    receivedByCommsAt: timing.receivedByCommsAt ? northbankIso(timing.receivedByCommsAt) : null,
    addedToMetisAt: northbankIso(timing.addedToMetisAt),
    intakeRoute: timing.intakeRoute,
  };
}

/** Project material logged into Metis when comms records it (not a live incident feed). */
export function fromProjectSource(
  base: IncomingBase,
  params: {
    eventOccurredAt: string;
    sourceTimestamp?: string;
    receivedByCommsAt: string;
    addedToMetisAt: string;
  },
): NorthbankIncomingUpdate {
  return build(base, {
    eventOccurredAt: params.eventOccurredAt,
    sourceTimestamp: params.sourceTimestamp ?? params.eventOccurredAt,
    receivedByCommsAt: params.receivedByCommsAt,
    addedToMetisAt: params.addedToMetisAt,
    intakeRoute: "reconstructed_from_project_source",
  });
}

export function directToComms(
  base: IncomingBase,
  params: {
    eventOccurredAt: string;
    sourceTimestamp?: string;
    addedToMetisAt?: string;
  },
): NorthbankIncomingUpdate {
  const at = params.eventOccurredAt;
  return build(base, {
    eventOccurredAt: at,
    sourceTimestamp: params.sourceTimestamp ?? at,
    receivedByCommsAt: at,
    addedToMetisAt: params.addedToMetisAt ?? at,
    intakeRoute: "direct_to_comms",
  });
}
