import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ExecutiveBriefSectionVariant =
  | "default"
  | "emphasis"
  | "caution"
  | "open"
  | "confirmed"
  | "guard-safe"
  | "guard-hold"
  | "footer"
  | "muted";

const VARIANT_STYLES: Record<ExecutiveBriefSectionVariant, string> = {
  default:
    "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_92%,var(--metis-frame-soft))]",
  emphasis:
    "border-[color-mix(in_oklab,var(--metis-brass)_28%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_7%,var(--metis-surface-card))]",
  caution:
    "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_20%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_42%,var(--metis-surface-card))]",
  open:
    "border-[color-mix(in_oklab,var(--metis-info)_18%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_38%,var(--metis-surface-card))]",
  confirmed:
    "border-[color-mix(in_oklab,var(--metis-status-success-fg)_18%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_32%,var(--metis-surface-card))]",
  "guard-safe":
    "border-[color-mix(in_oklab,var(--metis-status-success-fg)_22%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_38%,var(--metis-surface-card))]",
  "guard-hold":
    "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_24%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_36%,var(--metis-surface-card))]",
  footer:
    "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,var(--metis-surface-card))]",
  muted: "border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_40%,transparent)]",
};

export function ExecutiveBriefSection({
  eyebrow,
  title,
  description,
  children,
  className,
  variant = "default",
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** @deprecated use variant */
  tone?: never;
  variant?: ExecutiveBriefSectionVariant;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "min-w-0 break-words rounded-[0.85rem] border shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)]",
        VARIANT_STYLES[variant],
        compact ? "px-3.5 py-3" : "px-4 py-3.5 sm:px-4 sm:py-4",
        className,
      )}
    >
      <header className={cn("space-y-1", compact ? "mb-2.5" : "mb-3")}>
        {eyebrow ? (
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">{eyebrow}</p>
        ) : null}
        <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[--metis-text-primary]">{title}</h3>
        {description ? (
          <p className="max-w-prose text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
