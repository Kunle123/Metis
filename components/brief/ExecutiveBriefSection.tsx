import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ExecutiveBriefSectionVariant = "default" | "emphasis" | "neutral" | "inset" | "footer" | "muted";

/** Thin left accent only — surfaces stay neutral. */
export type ExecutiveBriefAccent = "none" | "brass" | "amber" | "slate";

const SURFACE =
  "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_96%,var(--metis-paper))] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]";

const ACCENT_LEFT: Record<ExecutiveBriefAccent, string> = {
  none: "border-l-transparent",
  brass: "border-l-[color-mix(in_oklab,var(--metis-brass)_55%,transparent)]",
  amber: "border-l-[color-mix(in_oklab,var(--metis-status-warning-fg)_35%,transparent)]",
  slate: "border-l-[color-mix(in_oklab,var(--metis-outline-strong)_55%,transparent)]",
};

export function ExecutiveBriefSection({
  eyebrow,
  title,
  description,
  children,
  className,
  variant = "neutral",
  accent = "none",
  compact = false,
  noBorder = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: ExecutiveBriefSectionVariant;
  accent?: ExecutiveBriefAccent;
  compact?: boolean;
  noBorder?: boolean;
}) {
  const emphasisRing =
    variant === "emphasis"
      ? "border-[color-mix(in_oklab,var(--metis-brass)_22%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))]"
      : SURFACE;

  return (
    <section
      className={cn(
        "min-w-0 break-words border-l-[3px]",
        ACCENT_LEFT[accent],
        noBorder ? "border-0 bg-transparent shadow-none" : cn("rounded-[0.65rem] border", emphasisRing),
        compact ? "px-4 py-3.5" : "px-5 py-4 sm:px-6 sm:py-5",
        className,
      )}
    >
      <header className={cn("space-y-1", compact ? "mb-3" : "mb-4")}>
        {eyebrow ? (
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">{eyebrow}</p>
        ) : null}
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-[--metis-text-primary]">{title}</h3>
        {description ? (
          <p className="max-w-prose text-[0.78rem] leading-relaxed text-[--metis-text-tertiary]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
