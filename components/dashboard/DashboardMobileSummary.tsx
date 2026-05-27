import type { IssueLedger } from "@/lib/issues/issueLifecycle";

/**
 * Compact single-line dashboard stats for small viewports.
 * Mirrors Metis ledger semantics (attention heuristics, open slots, exports) without large badges.
 */
export function DashboardMobileSummary({
  ledger,
  ledgerIssueCount,
  attentionCount,
  openQuestionSlots,
  savedExports,
}: {
  ledger: IssueLedger;
  ledgerIssueCount: number;
  attentionCount: number;
  openQuestionSlots: number;
  savedExports: number;
}) {
  if (ledgerIssueCount === 0) return null;

  const cohortLabel = ledger === "archived" ? "Archived" : "Active";

  return (
    <p
      className="mt-2 rounded-lg border border-[--metis-outline-subtle]/80 bg-[color-mix(in_oklab,var(--metis-frame-soft)_70%,transparent)] px-2.5 py-2 text-[0.7rem] leading-snug text-[--metis-text-secondary]"
      aria-label={`${ledgerIssueCount} ${cohortLabel}. ${attentionCount} may need attention. ${openQuestionSlots} open question slots. ${savedExports} saved exports.`}
    >
      <span className="font-semibold text-[--metis-text-primary]">{ledgerIssueCount}</span>
      {" "}
      {cohortLabel}
      {" · "}
      <span className="font-semibold text-[--metis-status-warning-fg]">{attentionCount}</span>
      {" Attention · "}
      <span className="font-semibold text-[--metis-text-primary]">{openQuestionSlots}</span>
      {" Questions · "}
      <span className="font-semibold text-[--metis-text-primary]">{savedExports}</span>
      {" Exports"}
    </p>
  );
}
