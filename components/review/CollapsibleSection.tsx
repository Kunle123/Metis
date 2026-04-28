import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Accessible details/summary wrapper with compact spacing.
 * Notes:
 * - Uses native <details> for keyboard + screen reader support.
 * - Keep summary content short and stable; avoid nesting interactive controls inside summary.
 */
export function CollapsibleSection({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  contentClassName,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
}) {
  return (
    <details
      className={cn(
        "rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className={cn("cursor-pointer list-none select-none", summaryClassName)}>{summary}</summary>
      <div className={cn("mt-3 border-t border-white/8 pt-3", contentClassName)}>{children}</div>
    </details>
  );
}

