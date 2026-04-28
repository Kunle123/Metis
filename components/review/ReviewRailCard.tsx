import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Dense right-rail card pattern for metadata, blockers, evidence summaries, and quick actions.
 * Intentionally minimal: title row + optional meta/action + children.
 */
export function ReviewRailCard({
  title,
  meta,
  action,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.2rem] border border-white/10 bg-[rgba(0,0,0,0.16)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">{title}</p>
          {meta ? <div className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{meta}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("mt-3 border-t border-white/8 pt-3", !meta && !action && "mt-2")}>{children}</div>
    </div>
  );
}

