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
        "rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_46%,var(--metis-surface-page))] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]",
        className,
      )}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className={cn("cursor-pointer list-none select-none", summaryClassName)}>{summary}</summary>
      <div className={cn("mt-3 border-t border-[--metis-outline-subtle] pt-3", contentClassName)}>{children}</div>
    </details>
  );
}

