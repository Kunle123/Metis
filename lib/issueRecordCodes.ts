function padOrdinal(n: number): string {
  return String(n).padStart(3, "0");
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
