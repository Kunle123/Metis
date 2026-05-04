import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = { id: T; label: ReactNode; disabled?: boolean };

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className,
}: {
  label?: ReactNode;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (next: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const wholeDisabled = Boolean(disabled);

  return (
    <div className={cn("space-y-[var(--metis-control-gap-sm)]", className)}>
      {label ? (
        <div className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">{label}</div>
      ) : null}
      <div
        role="group"
        aria-label={typeof label === "string" ? label : "Segmented control"}
        className={cn(
          "flex h-[var(--metis-control-height-md)] items-center rounded-[var(--metis-control-radius-lg)] border border-[--metis-segmented-rail-border] bg-[--metis-segmented-rail-bg] p-[var(--metis-segmented-rail-padding)]",
          "shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]",
          wholeDisabled &&
            "cursor-not-allowed border-dashed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] opacity-[0.92] shadow-none",
        )}
      >
        {options.map((o) => {
          const isSelected = o.id === value;
          const perOptDisabled = Boolean(o.disabled);
          const unavailable = wholeDisabled || perOptDisabled;

          const activeSelected =
            isSelected &&
            !unavailable &&
            cn(
              "border border-[--metis-control-active-border] bg-[--metis-control-active-bg] text-[--metis-text-primary]",
              "shadow-[inset_0_2px_0_rgba(255,255,255,0.22),inset_0_-2px_0_rgba(0,0,0,0.28),0_1px_0_rgba(255,255,255,0.06)]",
              "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-bold tracking-tight",
            );

          const unselectedEnabled =
            !isSelected &&
            !unavailable &&
            cn(
              "border border-transparent bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] text-[--metis-text-secondary]",
              "hover:border-[--metis-outline-subtle] hover:bg-[color-mix(in_oklab,var(--metis-control-hover-bg)_70%,transparent)] hover:text-[--metis-text-primary]",
              "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-medium",
            );

          const mutedDisabledWhole =
            unavailable &&
            wholeDisabled &&
            "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] cursor-not-allowed border-transparent bg-transparent px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0 line-through decoration-[--metis-control-disabled-border] hover:border-transparent hover:bg-transparent hover:text-[--metis-control-disabled-fg]";
          const mutedDisabledOption =
            unavailable &&
            !wholeDisabled &&
            cn(
              "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] cursor-not-allowed px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0",
              "border border-dashed border-[--metis-control-disabled-border] bg-[color-mix(in_oklab,var(--metis-control-disabled-bg)_88%,black)] opacity-80",
              "line-through decoration-[--metis-control-disabled-border]",
              "hover:border-dashed hover:border-[--metis-control-disabled-border] hover:bg-[color-mix(in_oklab,var(--metis-control-disabled-bg)_88%,black)] hover:text-[--metis-control-disabled-fg]",
            );

          return (
            <button
              key={o.id}
              type="button"
              disabled={unavailable}
              aria-pressed={isSelected}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative flex-1 shrink-0 truncate rounded-[var(--metis-control-radius-md)] transition-[background-color,border-color,color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring]",
                unavailable && "focus-visible:ring-0",
                activeSelected,
                unselectedEnabled,
                mutedDisabledWhole,
                mutedDisabledOption,
              )}
            >
              <span className="relative z-[1] flex items-center justify-center gap-[0.35rem] truncate">
                {isSelected && !unavailable ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[--metis-text-primary] opacity-95" strokeWidth={2.75} aria-hidden />
                ) : null}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
