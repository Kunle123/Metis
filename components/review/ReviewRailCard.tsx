import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReviewRailCardTone = "neutral" | "info";

const toneStyles: Record<ReviewRailCardTone, { wrap: string; divider: string; title: string }> = {
  neutral: {
    wrap: "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,var(--metis-surface-page))]",
    divider: "border-[--metis-outline-subtle]",
    title: "text-[--metis-text-tertiary]",
  },
  info: {
    wrap: "border-[--metis-info-border] bg-[--metis-info-bg]",
    divider: "border-[color-mix(in_oklab,var(--metis-info-border)_70%,transparent)]",
    title: "text-[--metis-info-soft]",
  },
};

/**
 * Dense right-rail card pattern for metadata, blockers, evidence summaries, and quick actions.
 * Intentionally minimal: title row + optional meta/action + children.
 */
export function ReviewRailCard({
  title,
  meta,
  action,
  children,
  tone = "neutral",
  className,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  tone?: ReviewRailCardTone;
  className?: string;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-[1.2rem] border px-4 py-4 shadow-[inset_0_1px_0_var(--metis-control-inset)]",
        t.wrap,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[0.62rem] font-medium uppercase tracking-[0.16em]", t.title)}>{title}</p>
          {meta ? <div className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{meta}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("mt-3 border-t pt-3", t.divider, !meta && !action && "mt-2")}>{children}</div>
    </div>
  );
}

