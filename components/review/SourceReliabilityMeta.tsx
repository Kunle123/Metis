/** Parse stored reliability strings shaped like `Medium (qualifier…)` vs plain labels. */
export function parseReliabilityDisplay(raw: string | null | undefined): {
  headline: string;
  detail: string | null;
} {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { headline: "In use", detail: null };
  }

  const open = trimmed.indexOf(" (");
  if (open === -1) {
    return { headline: trimmed, detail: null };
  }

  const headline = trimmed.slice(0, open).trim();
  let tail = trimmed.slice(open + 1).trim();
  if (tail.startsWith("(") && tail.endsWith(")")) {
    tail = tail.slice(1, -1).trim();
  }
  return {
    headline: headline || trimmed,
    detail: tail || null,
  };
}

/**
 * Brief / rail: reliability as metadata — short level only in a compact chip; long copy as muted body text.
 * Avoids `Badge` + `rounded-full` around multi-line strings (blob effect in dark mode).
 */
export function SourceReliabilityMeta({
  reliability,
  align = "start",
}: {
  reliability: string | null;
  align?: "start" | "end";
}) {
  const { headline, detail } = parseReliabilityDisplay(reliability);
  /** Chip only when we split out a note, or the whole value is already short. */
  const useCompactChip = detail !== null || headline.length <= 28;

  const stackAlign = align === "end" ? "items-start sm:items-end" : "items-start";
  const rowAlign = align === "end" ? "sm:justify-end" : "sm:justify-start";
  const detailAlign = align === "end" ? "sm:text-right" : "sm:text-left";

  return (
    <div className="min-w-0 w-full max-w-full">
      <div className={`flex flex-col gap-1.5 ${stackAlign}`}>
        <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${rowAlign}`}>
          <span className="shrink-0 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[--metis-ink-soft]">
            Reliability
          </span>
          {useCompactChip ? (
            <span className="inline-flex max-w-full rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)] px-2 py-0.5 text-[0.72rem] font-medium leading-tight text-[--metis-text-secondary]">
              {headline}
            </span>
          ) : (
            <span className="min-w-0 text-[0.75rem] leading-snug text-[--metis-text-secondary]">{headline}</span>
          )}
        </div>
        {detail ? (
          <p className={`break-words text-[0.72rem] leading-snug text-[--metis-paper-muted] ${detailAlign}`}>{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
