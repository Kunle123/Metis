import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";

export type ApprovalStatusUiTone =
  | "draft"
  | "in_review"
  | "approved"
  | "ready"
  | "sent"
  | "superseded";

export function approvalStatusUiTone(status: MessageApprovalStatus): ApprovalStatusUiTone {
  switch (status) {
    case "Draft":
      return "draft";
    case "InReview":
      return "in_review";
    case "Approved":
      return "approved";
    case "ReadyToCirculate":
      return "ready";
    case "Sent":
      return "sent";
    case "Superseded":
      return "superseded";
    default:
      return "draft";
  }
}

const TONE_CLASSES: Record<ApprovalStatusUiTone, string> = {
  draft:
    "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_72%,transparent)] text-[--metis-text-secondary]",
  in_review: "border-[--metis-info-border] bg-[--metis-info-bg] text-[--metis-text-primary]",
  approved: "border-[--metis-status-success-border] bg-[--metis-status-success-bg] text-[--metis-status-success-fg]",
  ready:
    "border-[color-mix(in_oklab,var(--metis-brass)_45%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass-soft)_22%,transparent)] text-[--metis-brass-soft]",
  sent: "border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] text-[--metis-status-neutral-fg]",
  superseded:
    "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_55%,transparent)] text-[--metis-text-tertiary]",
};

/** Sentence-case labels (“In review”, “Ready to circulate”) read better than all-caps for coordination status. */
const BASE =
  "max-w-full truncate rounded-md border px-2 py-0.5 text-[0.7rem] font-medium normal-case tracking-[0.01em]";

/** Tailwind-only classes for coordination approval badges (readable in light/dark). */
export function approvalStatusBadgeClassNames(status: MessageApprovalStatus): string {
  return `${BASE} ${TONE_CLASSES[approvalStatusUiTone(status)]}`;
}
