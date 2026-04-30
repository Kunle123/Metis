import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** `synthesis-available`: info-style cue that synthesis may touch content on regenerate (no claim it already did). */
export type AiProvenanceAiVariant = "enhanced-draft" | "synthesis-available";

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
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] px-3 py-1 text-[0.6875rem] leading-5 text-[--metis-status-neutral-fg]",
          className,
        )}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--metis-status-neutral-fg)_55%,transparent)]"
          aria-hidden
        />
        <span className="font-medium">Original deterministic draft</span>
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
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[--metis-status-info-border] bg-[--metis-status-info-bg] px-3 py-1 text-[0.6875rem] leading-5 text-[--metis-status-info-fg]",
        className,
      )}
      title={typeof aiHelper === "string" ? aiHelper : undefined}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90 text-[color-mix(in_oklab,var(--metis-status-info-fg)_92%,transparent)]" aria-hidden />
      <span className="font-medium">{aiHeadline}</span>
      <span className="hidden text-[color-mix(in_oklab,var(--metis-status-info-fg)_88%,transparent)] sm:inline">
        · {aiHelper}
      </span>
    </div>
  );
}
