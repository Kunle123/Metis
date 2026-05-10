import type { ClaimStatus } from "@metis/shared/claim";

export function claimStatusDisplayLabel(status: ClaimStatus): string {
  switch (status) {
    case "Confirmed":
      return "Confirmed";
    case "Assumption":
      return "Assumption";
    case "NeedsValidation":
      return "Needs validation";
    case "Superseded":
      return "Superseded";
    default:
      return String(status);
  }
}

const BASE =
  "inline-flex max-w-full shrink-0 truncate rounded-md border px-2 py-0.5 text-[0.7rem] font-medium normal-case tracking-[0.01em]";

/** Token-backed status chips for the claims register (light/dark safe). */
export function claimStatusBadgeClassNames(status: ClaimStatus): string {
  switch (status) {
    case "Confirmed":
      return `${BASE} border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_48%,transparent)] text-[--metis-status-success-fg]`;
    case "Assumption":
      return `${BASE} border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_65%,transparent)] text-[--metis-status-neutral-fg]`;
    case "NeedsValidation":
      return `${BASE} border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_48%,transparent)] text-[--metis-status-warning-fg]`;
    case "Superseded":
      return `${BASE} border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] text-[--metis-text-tertiary]`;
    default:
      return `${BASE} border-[--metis-outline-subtle] text-[--metis-text-secondary]`;
  }
}
