import { bramleyIncomingUpdates } from "./incoming-inputs";
import { bramleyClaims, bramleyObservations, bramleyOpenQuestions, bramleySources } from "./issue-record";
import { bramleyAt } from "./timestamps";

export type BramleySnapshot = {
  at: Date;
  incomingUpdateIds: string[];
  sourceIds: string[];
  claimIds: string[];
  openQuestionIds: string[];
  openQuestionIdsStillOpen: string[];
  observationIds: string[];
};

export function snapshotAt(isoLocal: string): BramleySnapshot {
  const at = bramleyAt(isoLocal);

  const incomingUpdateIds = bramleyIncomingUpdates
    .filter((u) => bramleyAt(u.addedToMetisAt) <= at)
    .map((u) => u.id);
  const sourceIds = bramleySources.filter((s) => bramleyAt(s.addedToMetisAt) <= at).map((s) => s.id);
  const claimIds = bramleyClaims.filter((c) => bramleyAt(c.createdAt) <= at).map((c) => c.id);

  const openQuestions = bramleyOpenQuestions.filter((q) => bramleyAt(q.createdAt) <= at);
  const openQuestionIds = openQuestions.map((q) => q.id);
  const openQuestionIdsStillOpen = openQuestions
    .filter((q) => {
      if (q.status === "Resolved" && q.resolvedAt && bramleyAt(q.resolvedAt) <= at) return false;
      if (!q.resolvedAt) return true;
      return bramleyAt(q.resolvedAt) > at;
    })
    .map((q) => q.id);

  const observationIds = bramleyObservations.filter((o) => bramleyAt(o.createdAt) <= at).map((o) => o.id);

  return {
    at,
    incomingUpdateIds,
    sourceIds,
    claimIds,
    openQuestionIds,
    openQuestionIdsStillOpen,
    observationIds,
  };
}

export function allRecordIds(snapshot: BramleySnapshot): string[] {
  return [
    ...snapshot.incomingUpdateIds,
    ...snapshot.sourceIds,
    ...snapshot.claimIds,
    ...snapshot.openQuestionIds,
    ...snapshot.observationIds,
  ];
}

export function notYetKnown(snapshot: BramleySnapshot, full: BramleySnapshot): string[] {
  const known = new Set(allRecordIds(snapshot));
  return allRecordIds(full).filter((id) => !known.has(id));
}
