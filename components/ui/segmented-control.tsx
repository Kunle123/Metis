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
    <div className={cn("space-y-1.5", className)}>
      {label ? <div className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">{label}</div> : null}
      <div
        role="group"
        aria-label={typeof label === "string" ? label : "Segmented control"}
        className={cn(
          "flex h-10 items-center rounded-full border border-[--metis-outline-subtle] bg-[--metis-surface-rail] p-1",
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
            "border-[--metis-control-active-border] bg-[--metis-control-active-bg] font-semibold text-[--metis-text-primary] shadow-[inset_0_2px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.35)] ring-1 ring-[color-mix(in_oklab,var(--metis-control-active-border)_35%,transparent)]";

          const unselectedEnabled =
            !isSelected &&
            !unavailable &&
            "border border-transparent bg-[color-mix(in_oklab,var(--metis-control-inset)_40%,transparent)] font-medium text-[--metis-text-secondary] hover:border-[--metis-outline-subtle] hover:bg-[var(--metis-control-hover-bg)] hover:text-[--metis-text-primary]";

          const mutedDisabledWhole = unavailable && wholeDisabled &&
            "cursor-not-allowed border-transparent bg-transparent font-normal text-[--metis-control-disabled-fg] shadow-none ring-0 hover:border-transparent hover:bg-transparent hover:text-[--metis-control-disabled-fg]";
          const mutedDisabledOption = unavailable && !wholeDisabled &&
            "cursor-not-allowed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] font-normal text-[--metis-control-disabled-fg] shadow-none ring-0 hover:border-[--metis-control-disabled-border] hover:bg-[--metis-control-disabled-bg] hover:text-[--metis-control-disabled-fg]";

          return (
            <button
              key={o.id}
              type="button"
              disabled={unavailable}
              aria-pressed={isSelected}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative h-8 flex-1 rounded-full px-3 text-sm transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring]",
                unavailable && "focus-visible:ring-0",
                activeSelected,
                unselectedEnabled,
                mutedDisabledWhole,
                mutedDisabledOption,
              )}
            >
              <span className="relative z-[1] flex items-center justify-center gap-2">
                {isSelected && !unavailable ? (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-[--metis-action-primary-bg] shadow-[0_0_0_1px_color-mix(in_oklab,var(--metis-frame)_70%,transparent)]"
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
