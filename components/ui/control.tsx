import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function ControlLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]", className)}>
      {children}
    </span>
  );
}

export function ControlHelper({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-xs leading-5 text-[--metis-paper-muted]", className)}>{children}</span>;
}

export function ControlField({
  label,
  helper,
  children,
  className,
}: {
  label: ReactNode;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("space-y-[var(--metis-control-gap-sm)]", className)}>
      <ControlLabel>{label}</ControlLabel>
      {children}
      {helper ? <div className="pt-1"><ControlHelper>{helper}</ControlHelper></div> : null}
    </label>
  );
}

export type ControlSelectSize = "sm" | "md";

export function ControlSelect({ controlSize = "md", className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { controlSize?: ControlSelectSize }) {
  const sizeClass =
    controlSize === "sm"
      ? cn(
          "min-h-[var(--metis-control-height-sm)] h-[var(--metis-control-height-sm)] px-[var(--metis-control-padding-x-sm)] text-sm",
          "rounded-[var(--metis-control-radius-sm)]",
        )
      : cn(
          "min-h-[var(--metis-control-height-md)] h-[var(--metis-control-height-md)] px-[var(--metis-control-padding-x-md)] text-sm",
          "rounded-[var(--metis-control-radius-md)]",
        );

  return (
    <select
      {...props}
      className={cn(
        sizeClass,
        "w-full cursor-pointer border border-[--metis-control-border] bg-[--metis-control-bg] text-[--metis-text-primary] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] hover:border-[--metis-control-border-hover] hover:bg-[var(--metis-control-hover-bg)] disabled:cursor-not-allowed disabled:border-[--metis-control-disabled-border] disabled:bg-[--metis-control-disabled-bg] disabled:text-[--metis-control-disabled-fg] disabled:opacity-100 disabled:shadow-none disabled:hover:border-[--metis-control-disabled-border] disabled:hover:bg-[--metis-control-disabled-bg]",
        className,
      )}
    />
  );
}
