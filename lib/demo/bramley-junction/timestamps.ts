/** Fictional scenario week: Sun 10 May 2026 (planned works) · Mon 11 May 2026 (handback day). */

const LONDON = "Europe/London";

/** Build a UTC Date for a local Europe/London wall time (BST, UTC+1 in May 2026). */
export function bramleyAt(isoLocal: string): Date {
  const withOffset = isoLocal.includes("T") ? isoLocal : `${isoLocal}T00:00:00`;
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$/.test(withOffset);
  const normalized = hasZone ? withOffset : `${withOffset}+01:00`;
  return new Date(normalized);
}

export function bramleyLabel(isoLocal: string): string {
  const d = bramleyAt(isoLocal);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function bramleyIso(isoLocal: string): string {
  return bramleyAt(isoLocal).toISOString();
}

/** Format a stored UTC ISO timestamp for UK local display labels. */
export function bramleyLabelFromAt(isoUtc: string): string {
  const d = new Date(isoUtc);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
