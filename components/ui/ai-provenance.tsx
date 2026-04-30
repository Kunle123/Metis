import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function AiProvenance({
  mode,
  helper = "AI-enhanced wording is an alternate draft. Review before use.",
  className,
}: {
  mode: "original" | "ai";
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

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[--metis-status-info-border] bg-[--metis-status-info-bg] px-3 py-1 text-[0.6875rem] leading-5 text-[--metis-status-info-fg]",
        className,
      )}
      title={typeof helper === "string" ? helper : undefined}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90 text-[color-mix(in_oklab,var(--metis-status-info-fg)_92%,transparent)]" aria-hidden />
      <span className="font-medium">AI-enhanced draft</span>
      <span className="hidden text-[color-mix(in_oklab,var(--metis-status-info-fg)_88%,transparent)] sm:inline">
        · {helper}
      </span>
    </div>
  );
}
