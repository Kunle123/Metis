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
      <div className={cn("inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[--metis-paper-muted]", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/30" aria-hidden />
        <span className="text-[--metis-paper]">Original deterministic draft</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[--metis-info-border] bg-[--metis-info-bg] px-3 py-1 text-xs text-[--metis-paper-muted]",
        className,
      )}
      title={typeof helper === "string" ? helper : undefined}
    >
      <Sparkles className="h-3.5 w-3.5 text-[--metis-info-soft]" aria-hidden />
      <span className="text-[--metis-paper]">AI-enhanced draft</span>
      <span className="hidden sm:inline text-[--metis-paper-muted]">· {helper}</span>
    </div>
  );
}

