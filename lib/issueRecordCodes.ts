function padOrdinal(n: number): string {
  return String(n).padStart(3, "0");
}

/** Human-readable issue-scoped claim label (`CLM-001`). */
export function formatClaimCode(claimNumber: number | null | undefined): string | null {
  if (claimNumber == null || claimNumber <= 0) return null;
  return `CLM-${padOrdinal(claimNumber)}`;
}

/** Human-readable issue-scoped open-question label (`Q-001`). */
export function formatGapCode(gapNumber: number | null | undefined): string | null {
  if (gapNumber == null || gapNumber <= 0) return null;
  return `Q-${padOrdinal(gapNumber)}`;
}

/** Human-readable issue-scoped observation label (`OBS-001`). */
export function formatObservationCode(observationNumber: number | null | undefined): string | null {
  if (observationNumber == null || observationNumber <= 0) return null;
  return `OBS-${padOrdinal(observationNumber)}`;
}

const SRC_NUMERIC_CODE = /^SRC-(\d+)$/;

/**
 * Parses Metis numeric source codes (`SRC-1`, `SRC-01`, `SRC-001`) to their ordinal.
 * Custom codes (`SRC-OFF`, `SC-REL-A`) return null.
 */
export function parseNumericSourceCodeOrdinal(sourceCode: string | null | undefined): number | null {
  if (sourceCode == null) return null;
  const m = SRC_NUMERIC_CODE.exec(sourceCode.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Canonical numeric source label: at least three digits (`SRC-001`), matching Q/OBS width.
 * Values above 999 use an unpadded suffix (`SRC-1000`) so we never truncate the ordinal.
 */
export function formatNumericSourceCode(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "SRC-000";
  if (n > 999) return `SRC-${n}`;
  return `SRC-${String(n).padStart(3, "0")}`;
}
