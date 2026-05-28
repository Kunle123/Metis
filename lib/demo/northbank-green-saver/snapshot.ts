import { northbankIncomingUpdates } from "./incoming-inputs";
import { northbankClaims, northbankObservations, northbankOpenQuestions, northbankSources } from "./issue-record";
import { northbankAt } from "./timestamps";

export type NorthbankSnapshot = {
  at: Date;
  incomingUpdateIds: string[];
  sourceIds: string[];
  claimIds: string[];
  openQuestionIds: string[];
  openQuestionIdsStillOpen: string[];
  observationIds: string[];
};

export function snapshotAt(isoLocal: string): NorthbankSnapshot {
  const at = northbankAt(isoLocal);

  const incomingUpdateIds = northbankIncomingUpdates
    .filter((u) => northbankAt(u.addedToMetisAt) <= at)
    .map((u) => u.id);
  const sourceIds = northbankSources.filter((s) => northbankAt(s.addedToMetisAt) <= at).map((s) => s.id);
  const claimIds = northbankClaims.filter((c) => northbankAt(c.createdAt) <= at).map((c) => c.id);

  const openQuestions = northbankOpenQuestions.filter((q) => northbankAt(q.createdAt) <= at);
  const openQuestionIds = openQuestions.map((q) => q.id);
  const openQuestionIdsStillOpen = openQuestions
    .filter((q) => {
      if (q.status === "Resolved" && q.resolvedAt && northbankAt(q.resolvedAt) <= at) return false;
      if (!q.resolvedAt) return true;
      return northbankAt(q.resolvedAt) > at;
    })
    .map((q) => q.id);

  const observationIds = northbankObservations.filter((o) => northbankAt(o.createdAt) <= at).map((o) => o.id);

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

export function allRecordIds(snapshot: NorthbankSnapshot): string[] {
  return [
    ...snapshot.incomingUpdateIds,
    ...snapshot.sourceIds,
    ...snapshot.claimIds,
    ...snapshot.openQuestionIds,
    ...snapshot.observationIds,
  ];
}

export function notYetKnown(snapshot: NorthbankSnapshot, full: NorthbankSnapshot): string[] {
  const known = new Set(allRecordIds(snapshot));
  return allRecordIds(full).filter((id) => !known.has(id));
}
