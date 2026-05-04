import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** `synthesis-available`: info-style cue that synthesis may touch content on regenerate (no claim it already did). */
export type AiProvenanceAiVariant = "enhanced-draft" | "synthesis-available";

/** Compact badge row only — long copy renders as plain supporting text below (not a giant pill). */
const chipHeadline = cn(
  "inline-flex max-w-full min-w-0 items-center rounded-[var(--metis-control-radius-pill)]",
  "gap-[0.25rem] px-[var(--metis-chip-padding-x-sm)]",
  "min-h-[var(--metis-chip-height-sm)] h-[var(--metis-chip-height-sm)] py-0",
  "text-[var(--metis-chip-font-size)] font-medium leading-none tracking-tight",
  "border border-white/[0.07] shadow-none",
);

export function AiProvenance({
  mode,
  variant,
  helper,
  className,
}: {
  mode: "original" | "ai";
  /** Only used when mode is `ai`; defaults to `enhanced-draft` (Messages behaviour). */
  variant?: AiProvenanceAiVariant;
  helper?: ReactNode;
  className?: string;
}) {
  if (mode === "original") {
    return (
      <div className={cn("max-w-full min-w-0", className)}>
        <div
          className={cn(
            chipHeadline,
            "bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_92%,transparent)] text-[--metis-status-neutral-fg]",
          )}
        >
          <span
            className="h-[0.35rem] w-[0.35rem] shrink-0 rounded-full bg-[color-mix(in_oklab,var(--metis-status-neutral-fg)_45%,transparent)]"
            aria-hidden
          />
          <span className="truncate">Original deterministic draft</span>
        </div>
      </div>
    );
  }

  const resolvedAiVariant = variant ?? "enhanced-draft";
  const aiHelper =
    helper ??
    (resolvedAiVariant === "synthesis-available"
      ? "Executive summary paragraph may optionally be rewritten via synthesis when you regenerate Brief. Review before circulation."
      : "AI-enhanced wording is an alternate draft. Review before use.");

  const aiHeadline =
    resolvedAiVariant === "synthesis-available" ? "Synthesis-aware paragraph" : "AI-enhanced draft";

  return (
    <div className={cn("max-w-full min-w-0 space-y-1.5", className)} title={typeof aiHelper === "string" ? aiHelper : undefined}>
      <div
        className={cn(
          chipHeadline,
          "bg-[color-mix(in_oklab,var(--metis-status-info-bg)_85%,transparent)] text-[--metis-status-info-fg]",
        )}
      >
        <Sparkles className="h-3 w-3 shrink-0 text-[color-mix(in_oklab,var(--metis-status-info-fg)_88%,transparent)] opacity-90" aria-hidden />
        <span className="truncate font-semibold">{aiHeadline}</span>
      </div>
      <div className="max-w-[min(100%,28rem)] text-[0.625rem] leading-relaxed text-[--metis-text-tertiary]">{aiHelper}</div>
    </div>
  );
}
