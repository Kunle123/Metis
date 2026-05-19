/** Truncate long strings for native `title` / `aria-label` tooltips. */
export function truncateForTooltip(text: string, max = 180): string {
  const t = text.trim();
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}
