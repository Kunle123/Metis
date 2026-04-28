import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReviewRailCardTone = "neutral" | "info";

const toneStyles: Record<ReviewRailCardTone, { wrap: string; divider: string; title: string }> = {
  neutral: {
    wrap: "border-white/12 bg-[rgba(0,0,0,0.22)]",
    divider: "border-white/10",
    title: "text-[--metis-ink-soft]",
  },
  info: {
    wrap: "border-[--metis-info-border] bg-[--metis-info-bg]",
    divider: "border-white/10",
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
        "rounded-[1.2rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
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

