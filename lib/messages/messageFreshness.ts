import type { IssueActivityKind } from "@metis/shared/activity";

import { BRIEF_FRESHNESS_BENIGN_ACTIVITY_KINDS } from "@/lib/brief/briefFreshness";

/**
 * Activity kinds that bump `Issue.updatedAt` via `issue.update` but do not require
 * re-deriving a saved message draft from issue inputs — same bookkeeping idea as brief
 * freshness plus the draft’s own activity row (`message_variant_created`).
 */
export const MESSAGE_DRAFT_FRESHNESS_BENIGN_ACTIVITY_KINDS: ReadonlySet<IssueActivityKind> =
  new Set<IssueActivityKind>([...BRIEF_FRESHNESS_BENIGN_ACTIVITY_KINDS, "message_variant_created"]);

/**
 * Staleness for a stored MessageVariant row when `Issue.updatedAt` advances for benign
 * reasons (draft save activity, exports, circulation, etc.).
 *
 * Same structure as brief freshness: substantive activity after revision → stale;
 * benign-only bookkeeping after revision → not stale;
 * mismatch with no intervening rows → treat as substantive drift (e.g. PATCH without activity).
 */
export function isStoredMessageDraftStale(params: {
  hasStoredDraft: boolean;
  generatedFromIssueUpdatedAt: Date | null | undefined;
  issueUpdatedAt: Date;
  activitiesStrictlyAfterRevision: Iterable<{ kind: IssueActivityKind; createdAt: Date }>;
}): boolean {
  const { hasStoredDraft, generatedFromIssueUpdatedAt, issueUpdatedAt, activitiesStrictlyAfterRevision } =
    params;
  if (!hasStoredDraft || !generatedFromIssueUpdatedAt) return false;

  const genMs = generatedFromIssueUpdatedAt.getTime();
  const issueMs = issueUpdatedAt.getTime();
  /** Aligned at save or revision newer than stamped issue stamp. */
  if (genMs >= issueMs) return false;

  const after = [...activitiesStrictlyAfterRevision].filter((a) => a.createdAt.getTime() > genMs);
  if (after.some((a) => !MESSAGE_DRAFT_FRESHNESS_BENIGN_ACTIVITY_KINDS.has(a.kind))) {
    return true;
  }

  if (after.length > 0) return false;

  return true;
}
