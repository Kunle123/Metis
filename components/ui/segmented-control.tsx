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
  /** When true, segment labels can wrap instead of truncating — use for longer paired labels (e.g. brief mode). */
  allowLabelWrap,
}: {
  label?: ReactNode;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (next: T) => void;
  disabled?: boolean;
  className?: string;
  allowLabelWrap?: boolean;
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
          "flex items-stretch rounded-[var(--metis-control-radius-lg)] border border-[--metis-segmented-rail-border] bg-[--metis-segmented-rail-bg] p-[var(--metis-segmented-rail-padding)]",
          allowLabelWrap ? "min-h-[var(--metis-control-height-md)]" : "h-[var(--metis-control-height-md)] items-center",
          "shadow-[inset_0_1px_4px_color-mix(in_oklab,black_35%,transparent)]",
          wholeDisabled &&
            "cursor-not-allowed border-dashed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] opacity-[0.92] shadow-none",
        )}
      >
        {options.map((o) => {
          const isSelected = o.id === value;
          const perOptDisabled = Boolean(o.disabled);
          const unavailable = wholeDisabled || perOptDisabled;

          const slotBox = allowLabelWrap
            ? "min-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] py-1.5 text-sm font-bold leading-tight tracking-tight"
            : "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-bold tracking-tight";

          const slotBoxUnsel = allowLabelWrap
            ? "min-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] py-1.5 text-sm font-medium leading-tight tracking-tight"
            : "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)] px-[var(--metis-control-padding-x-sm)] text-sm leading-none font-medium";

          const activeSelected =
            isSelected &&
            !unavailable &&
            cn(
              "border border-[--metis-control-active-border] bg-[--metis-control-active-bg] text-[--metis-text-primary]",
              "shadow-[inset_0_1px_0_color-mix(in_oklab,white_20%,transparent),inset_0_-1px_0_color-mix(in_oklab,black_30%,transparent),0_1px_0_color-mix(in_oklab,white_8%,transparent)]",
              slotBox,
            );

          const unselectedEnabled =
            !isSelected &&
            !unavailable &&
            cn(
              "border border-transparent bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] text-[--metis-text-secondary]",
              "hover:border-[--metis-outline-subtle] hover:bg-[color-mix(in_oklab,var(--metis-control-hover-bg)_70%,transparent)] hover:text-[--metis-text-primary]",
              slotBoxUnsel,
            );

          const mutedDisabledWhole =
            unavailable &&
            wholeDisabled &&
            cn(
              "cursor-not-allowed border-transparent bg-transparent px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0 line-through decoration-[--metis-control-disabled-border] hover:border-transparent hover:bg-transparent hover:text-[--metis-control-disabled-fg]",
              allowLabelWrap ? "min-h-[var(--metis-segmented-slot-height)] py-1.5" : "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)]",
            );
          const mutedDisabledOption =
            unavailable &&
            !wholeDisabled &&
            cn(
              "cursor-not-allowed px-[var(--metis-control-padding-x-sm)] text-sm font-normal leading-none text-[--metis-control-disabled-fg] shadow-none ring-0",
              allowLabelWrap ? "min-h-[var(--metis-segmented-slot-height)] py-1.5" : "min-h-[var(--metis-segmented-slot-height)] h-[var(--metis-segmented-slot-height)] max-h-[var(--metis-segmented-slot-height)]",
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
                "relative flex-1 shrink-0 rounded-[var(--metis-control-radius-md)] transition-[background-color,border-color,color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring]",
                !allowLabelWrap && "truncate",
                unavailable && "focus-visible:ring-0",
                activeSelected,
                unselectedEnabled,
                mutedDisabledWhole,
                mutedDisabledOption,
              )}
            >
              <span
                className={cn(
                  "relative z-[1] flex items-center justify-center gap-[0.35rem] text-center",
                  allowLabelWrap ? "min-w-0 whitespace-normal text-balance" : "truncate",
                )}
              >
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
