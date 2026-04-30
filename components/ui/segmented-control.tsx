import type { ReactNode } from "react";

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
          "flex h-[var(--metis-control-height-md)] items-center rounded-[var(--metis-control-radius-pill)] border border-[--metis-outline-subtle] bg-[--metis-surface-rail] p-[var(--metis-segmented-rail-padding)]",
          wholeDisabled && "cursor-not-allowed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg]",
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
              "border-[--metis-control-active-border] bg-[--metis-control-active-bg] text-[--metis-text-primary] shadow-[inset_0_2px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.35)] ring-1 ring-[color-mix(in_oklab,var(--metis-control-active-border)_35%,transparent)]",
              "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-semibold",
            );

          const unselectedEnabled =
            !isSelected &&
            !unavailable &&
            cn(
              "border border-transparent bg-[color-mix(in_oklab,var(--metis-control-inset)_40%,transparent)] text-[--metis-text-secondary] hover:border-[--metis-outline-subtle] hover:bg-[var(--metis-control-hover-bg)] hover:text-[--metis-text-primary]",
              "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-medium",
            );

          const mutedDisabledWhole =
            unavailable &&
            wholeDisabled &&
            "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] cursor-not-allowed border-transparent bg-transparent px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0 hover:border-transparent hover:bg-transparent hover:text-[--metis-control-disabled-fg]";
          const mutedDisabledOption =
            unavailable &&
            !wholeDisabled &&
            "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] cursor-not-allowed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0 hover:border-[--metis-control-disabled-border] hover:bg-[--metis-control-disabled-bg] hover:text-[--metis-control-disabled-fg]";

          return (
            <button
              key={o.id}
              type="button"
              disabled={unavailable}
              aria-pressed={isSelected}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative flex-1 shrink-0 truncate rounded-[var(--metis-control-radius-pill)] transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring]",
                unavailable && "focus-visible:ring-0",
                activeSelected,
                unselectedEnabled,
                mutedDisabledWhole,
                mutedDisabledOption,
              )}
            >
              <span className="relative z-[1] flex items-center justify-center gap-[var(--metis-chip-gap)] truncate">
                {isSelected && !unavailable ? (
                  <span
                    className="h-[var(--metis-chip-dot-size)] w-[var(--metis-chip-dot-size)] shrink-0 rounded-full bg-[--metis-action-primary-bg] shadow-[0_0_0_1px_color-mix(in_oklab,var(--metis-frame)_70%,transparent)]"
                    aria-hidden
                  />
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
