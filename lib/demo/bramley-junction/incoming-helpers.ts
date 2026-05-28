import type { BramleyIncomingUpdate, BramleyIntakeRoute } from "./types";
import { bramleyIso } from "./timestamps";

type IncomingBase = Pick<
  BramleyIncomingUpdate,
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
    intakeRoute: BramleyIntakeRoute;
  },
): BramleyIncomingUpdate {
  return {
    ...base,
    eventOccurredAt: bramleyIso(timing.eventOccurredAt),
    sourceTimestamp: bramleyIso(timing.sourceTimestamp),
    receivedByCommsAt: timing.receivedByCommsAt ? bramleyIso(timing.receivedByCommsAt) : null,
    addedToMetisAt: bramleyIso(timing.addedToMetisAt),
    intakeRoute: timing.intakeRoute,
  };
}

/** Overnight operational log later reconstructed into Metis after comms engagement. */
export function operationalReconstructed(
  base: IncomingBase,
  params: {
    eventOccurredAt: string;
    sourceTimestamp?: string;
    /** When comms first learned of this (usually duty manager handover). */
    receivedByCommsAt: string;
    addedToMetisAt: string;
  },
): BramleyIncomingUpdate {
  return build(base, {
    eventOccurredAt: params.eventOccurredAt,
    sourceTimestamp: params.sourceTimestamp ?? params.eventOccurredAt,
    receivedByCommsAt: params.receivedByCommsAt,
    addedToMetisAt: params.addedToMetisAt,
    intakeRoute: "reconstructed_from_operational_source",
  });
}

/** Submitted update received and logged in Metis (working-hours comms channel). */
export function directToComms(
  base: IncomingBase,
  params: {
    /** Operational event time described in the update (modal only — not timeline axis). */
    eventOccurredAt: string;
    sourceTimestamp?: string;
    receivedByCommsAt?: string;
    addedToMetisAt?: string;
  },
): BramleyIncomingUpdate {
  const at = params.eventOccurredAt;
  const received = params.receivedByCommsAt ?? at;
  const added = params.addedToMetisAt ?? received;
  return build(base, {
    eventOccurredAt: at,
    sourceTimestamp: params.sourceTimestamp ?? at,
    receivedByCommsAt: received,
    addedToMetisAt: added,
    intakeRoute: "direct_to_comms",
  });
}
