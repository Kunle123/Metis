import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** `synthesis-available`: info-style cue that synthesis may touch content on regenerate (no claim it already did). */
export type AiProvenanceAiVariant = "enhanced-draft" | "synthesis-available";

const chipSurface = cn(
  "inline-flex max-w-full min-w-0 items-center truncate rounded-[var(--metis-control-radius-pill)] border text-[var(--metis-chip-font-size)] leading-tight font-medium tracking-tight",
  "gap-[var(--metis-chip-gap)] px-[var(--metis-chip-padding-x-md)]",
  /* Visually lighter than `--metis-control-height-md`; aligns in flex rows via items-center without matching button mass */
  "min-h-[var(--metis-chip-height-md)] h-[var(--metis-chip-height-md)] py-0",
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
      <div
        className={cn(chipSurface, "border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] text-[--metis-status-neutral-fg]", className)}
      >
        <span
          className="h-[var(--metis-chip-dot-size)] w-[var(--metis-chip-dot-size)] shrink-0 rounded-full bg-[color-mix(in_oklab,var(--metis-status-neutral-fg)_55%,transparent)]"
          aria-hidden
        />
        <span className="truncate">Original deterministic draft</span>
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
    <div
      className={cn(chipSurface, "border-[--metis-status-info-border] bg-[--metis-status-info-bg] text-[--metis-status-info-fg]", className)}
      title={typeof aiHelper === "string" ? aiHelper : undefined}
    >
      <Sparkles
        className="h-[var(--metis-icon-size-sm)] w-[var(--metis-icon-size-sm)] shrink-0 opacity-90 text-[color-mix(in_oklab,var(--metis-status-info-fg)_92%,transparent)]"
        aria-hidden
      />
      <span className="truncate">{aiHeadline}</span>
      <span className="hidden min-w-0 truncate text-[color-mix(in_oklab,var(--metis-status-info-fg)_88%,transparent)] sm:inline">
        · {aiHelper}
      </span>
    </div>
  );
}
