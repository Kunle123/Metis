import Link from "next/link";

import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import { approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import type { ClaimAlignmentFinding } from "@/lib/conflicts/claimAlignment";
import { approvalStatusBadgeClassNames } from "@/lib/approvals/approvalStatusUi";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { cn } from "@/lib/utils";

import { circulationSafetyHints } from "./messageDraftPresentation";

function claimFindingToneClass(sev: ClaimAlignmentFinding["severity"]) {
  switch (sev) {
    case "critical":
      return "border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_40%,transparent)] text-[--metis-status-danger-fg]";
    case "warning":
      return "border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_40%,transparent)] text-[--metis-status-warning-fg]";
    default:
      return "border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_45%,transparent)] text-[--metis-text-secondary]";
  }
}

export function MessageReviewRail({
  issueId,
  hasSavedDraft,
  inSync,
  approvalStatus,
  audienceLabel,
  templateHelperText,
  openGapsLabel,
  claimAlignmentMode,
  findings,
}: {
  issueId: string;
  hasSavedDraft: boolean;
  inSync: boolean;
  approvalStatus: MessageApprovalStatus | null;
  audienceLabel: string;
  templateHelperText: string;
  openGapsLabel: string;
  claimAlignmentMode: "saved_draft" | "preview_only";
  findings: ClaimAlignmentFinding[];
}) {
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const safetyHints = circulationSafetyHints({
    hasSavedDraft,
    inSync,
    approvalStatus,
    claimFindingCount: findings.length,
    criticalFindingCount: criticalCount,
  });

  return (
    <div className="min-w-0 space-y-4">
      <ReviewRailCard
        title="Review before use"
        tone="info"
        meta={
          <p className="text-[0.78rem] leading-relaxed text-[--metis-text-secondary]">
            Controlled comms artefact — check alignment, approval, and freshness before any channel uses this wording.
          </p>
        }
      >
        <ul className="space-y-2">
          {safetyHints.map((hint) => (
            <li key={hint} className="grid grid-cols-[8px_minmax(0,1fr)] gap-2.5 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[--metis-outline-strong]" aria-hidden />
              <span>{hint}</span>
            </li>
          ))}
        </ul>
        {!hasSavedDraft ? (
          <p className="mt-3 rounded-md border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_40%,transparent)] px-3 py-2 text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">
            Unsaved preview has not been reviewed for claim alignment. Save a numbered draft to analyse stored wording.
          </p>
        ) : null}
      </ReviewRailCard>

      <ReviewRailCard
        title="Claim alignment"
        tone="neutral"
        meta={
          claimAlignmentMode === "preview_only" ? (
            <p className="text-[0.78rem] leading-relaxed text-[--metis-paper-muted]">
              Save a draft to run review risks against the Claims register.
            </p>
          ) : (
            <p className="text-[0.78rem] leading-relaxed text-[--metis-paper-muted]">
              {findings.length
                ? `${findings.length} review risk${findings.length === 1 ? "" : "s"} on the saved draft — heuristic only.`
                : "No review risks flagged for the saved draft."}
            </p>
          )
        }
      >
        {claimAlignmentMode === "preview_only" ? (
          <p className="text-[0.8125rem] leading-relaxed text-[--metis-paper-muted]">
            Copy, generate, and save as usual. Alignment review applies to persisted drafts only.
          </p>
        ) : findings.length === 0 ? (
          <p className="text-[0.8125rem] text-[--metis-status-neutral-fg]">No claim alignment concerns detected.</p>
        ) : (
          <ul className="space-y-2">
            {findings.map((f) => (
              <li key={f.id} className={cn("rounded-md border px-3 py-2.5 text-[0.78rem] leading-snug", claimFindingToneClass(f.severity))}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em]">{f.severity}</span>
                  <span className="rounded border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_55%,transparent)] px-1.5 py-0.5 font-mono text-[0.62rem] text-[--metis-text-tertiary]">
                    {f.claimCode}
                  </span>
                </div>
                <p className="mt-1.5 text-[--metis-text-primary]">{f.message}</p>
                <p className="mt-1 text-[--metis-text-secondary]">
                  <span className="font-medium text-[--metis-text-tertiary]">Suggested · </span>
                  {f.suggestedAction}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[0.72rem] leading-snug text-[--metis-text-tertiary]">
          <Link href={`/issues/${issueId}/claims`} className="text-[--metis-brass-soft] underline-offset-2 hover:underline">
            Claims register
          </Link>
          {" · "}
          does not block copy or save.
        </p>
      </ReviewRailCard>

      <ReviewRailCard title="Draft context" tone="neutral">
        <div className="space-y-2.5 text-[0.8125rem] leading-relaxed text-[--metis-paper-muted]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">Audience</span>
            <span className="text-right text-[--metis-paper]">{audienceLabel}</span>
          </div>
          {hasSavedDraft && approvalStatus ? (
            <div className="flex items-center justify-between gap-2 border-t border-[--metis-outline-subtle] pt-2">
              <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">Approval</span>
              <span className={approvalStatusBadgeClassNames(approvalStatus)}>{approvalStatusDisplayLabel(approvalStatus)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2 border-t border-[--metis-outline-subtle] pt-2">
            <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">Freshness</span>
            <span className={inSync ? "text-[--metis-status-neutral-fg]" : "text-[--metis-status-warning-fg]"}>
              {hasSavedDraft ? (inSync ? "Up to date" : "Needs refresh") : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-[--metis-outline-subtle] pt-2">
            <span className="text-[0.58rem] uppercase tracking-[0.12em] text-[--metis-ink-soft]">Open questions</span>
            <Link href={`/issues/${issueId}/gaps`} className="text-[--metis-paper] underline-offset-2 hover:underline">
              {openGapsLabel}
            </Link>
          </div>
          <p className="border-t border-[--metis-outline-subtle] pt-2 text-[0.75rem]">{templateHelperText}</p>
        </div>
      </ReviewRailCard>
    </div>
  );
}
