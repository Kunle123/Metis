import type { IssueActivityKind } from "@metis/shared/activity";

/**
 * Activity kinds that touch the issue ledger but should not invalidate stored brief freshness
 * (exports, circulation logs, alternate comms-plan rows). Brief inputs are sourced from intake,
 * gaps, observations, sources, messages audience, etc.
 */
export const BRIEF_FRESHNESS_BENIGN_ACTIVITY_KINDS: ReadonlySet<IssueActivityKind> = new Set([
  "brief_version_created",
  "export_created",
  "export_approval_updated",
  "circulation_event_created",
  "comms_plan_item_created",
  "comms_plan_item_updated",
  "comms_plan_item_prepared",
  "comms_plan_item_sent",
  "comms_plan_item_skipped",
]);

/**
 * When a brief was generated, `BriefVersion.generatedFromIssueUpdatedAt` is aligned with
 * `Issue.updatedAt`. Later, `Issue.updatedAt` also advances for many activity writes that do not
 * change deterministic brief inputs. We treat staleness as: revision predates latest issue stamp
 * **and** either (a) there is substantive activity after revision, or (b) issue updated since
 * revision with **no** activity rows (typically intake edits via PATCH that did not emit activity).
 *
 * Exported for dashboard + brief UI.
 */
export function isStoredBriefModeStale(params: {
  hasStoredBrief: boolean;
  generatedFromIssueUpdatedAt: Date | null | undefined;
  /** Current `Issue.updatedAt` — Prisma bumps this on structural changes and most activity-linked updates. */
  issueUpdatedAt: Date;
  /**
   * Activity rows **for this issue** with `createdAt` strictly after `generatedFromIssueUpdatedAt`,
   * in any order. Caller scopes the query window (e.g. `createdAt > floor`).
   */
  activitiesStrictlyAfterRevision: Iterable<{ kind: IssueActivityKind; createdAt: Date }>;
}): boolean {
  const { hasStoredBrief, generatedFromIssueUpdatedAt, issueUpdatedAt, activitiesStrictlyAfterRevision } = params;
  if (!hasStoredBrief || !generatedFromIssueUpdatedAt) return false;

  const genMs = generatedFromIssueUpdatedAt.getTime();
  const issueMs = issueUpdatedAt.getTime();
  /** Aligned-at-generation or clock-order safety: revision is newer than stamped issue stamp. */
  if (genMs >= issueMs) return false;

  const after = [...activitiesStrictlyAfterRevision].filter((a) => a.createdAt.getTime() > genMs);
  if (after.some((a) => !BRIEF_FRESHNESS_BENIGN_ACTIVITY_KINDS.has(a.kind))) {
    return true;
  }

  /** Only benign bookkeeping since revision — timestamps still disagree (e.g. other mode's benign activity ignored). Do not imply regeneration is required for this artifact. */
  if (after.length > 0) {
    return false;
  }

  /** `updatedAt` advanced without substantive activity logged — treat as content drift (e.g. intake PATCH summary). */
  return true;
}
