import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ExecutiveBriefSection({
  eyebrow,
  title,
  description,
  children,
  className,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "emphasis" | "caution" | "guard";
}) {
  const toneClass =
    tone === "emphasis"
      ? "border-[color-mix(in_oklab,var(--metis-brass)_32%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_6%,var(--metis-surface-card))]"
      : tone === "caution"
        ? "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_35%,var(--metis-surface-card))]"
        : tone === "guard"
          ? "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,var(--metis-surface-card))]"
          : "border-[--metis-outline-subtle] bg-[--metis-surface-card]";

  return (
    <section
      className={cn(
        "rounded-[1.05rem] border px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_16%,transparent)] sm:px-5 sm:py-5",
        toneClass,
        className,
      )}
    >
      <header className="mb-3 space-y-1">
        {eyebrow ? (
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">{eyebrow}</p>
        ) : null}
        <h3 className="font-[Cormorant_Garamond] text-xl leading-snug text-[--metis-text-primary] sm:text-[1.35rem]">{title}</h3>
        {description ? <p className="max-w-3xl text-[0.8rem] leading-relaxed text-[--metis-text-tertiary]">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
