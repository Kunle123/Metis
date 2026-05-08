import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Compact control surface for review/output pages.
 * Intended usage: template/audience selectors + generate/copy actions + status pills.
 */
export function ReviewToolbar({
  left,
  right,
  children,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  /** Optional additional content placed between left and right (rare). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.2rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)] sm:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">{left}</div>
        {children ? <div className="min-w-0 flex-1">{children}</div> : null}
        <div className="min-w-0 w-full shrink-0 md:w-auto">{right}</div>
      </div>
    </div>
  );
}

