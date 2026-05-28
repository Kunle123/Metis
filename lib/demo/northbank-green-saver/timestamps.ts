/** Fictional launch readiness window: two working weeks starting Mon 8 Jun 2026. */

const LONDON = "Europe/London";

export function northbankAt(isoLocal: string): Date {
  const withOffset = isoLocal.includes("T") ? isoLocal : `${isoLocal}T00:00:00`;
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(withOffset);
  const normalized = hasZone ? withOffset : `${withOffset}+01:00`;
  return new Date(normalized);
}

export function northbankIso(isoLocal: string): string {
  return northbankAt(isoLocal).toISOString();
}

export function northbankLabel(isoLocal: string): string {
  const d = northbankAt(isoLocal);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function northbankLabelFromAt(isoUtc: string): string {
  const d = new Date(isoUtc);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Human display time for timeline projection cards. */
export function northbankDisplayTime(isoLocal: string): string {
  return northbankLabel(isoLocal);
}
