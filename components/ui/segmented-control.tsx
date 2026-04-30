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
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <div className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">{label}</div> : null}
      <div
        role="group"
        aria-label={typeof label === "string" ? label : "Segmented control"}
        className={cn(
          "flex h-10 items-center rounded-full border border-[--metis-control-border] bg-[rgba(255,255,255,0.04)] p-1",
          disabled && "cursor-not-allowed border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] opacity-100",
        )}
      >
        {options.map((o) => {
          const isSelected = o.id === value;
          const isDisabled = Boolean(disabled || o.disabled);
          return (
            <button
              key={o.id}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => onChange(o.id)}
              className={cn(
                "h-8 flex-1 rounded-full px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] disabled:focus-visible:ring-0",
                isSelected ? "bg-[--metis-control-active-bg] text-[--metis-text-primary]" : "text-[--metis-text-secondary] hover:text-[--metis-text-primary]",
                isDisabled &&
                  "cursor-not-allowed bg-transparent text-[--metis-control-disabled-fg] opacity-100 hover:bg-transparent hover:text-[--metis-control-disabled-fg]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

