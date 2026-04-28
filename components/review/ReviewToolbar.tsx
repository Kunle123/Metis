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
        "rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.14)] px-4 py-4 sm:px-5",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">{left}</div>
        {children ? <div className="min-w-0 flex-1">{children}</div> : null}
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}

