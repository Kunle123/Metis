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
    <label className={cn("space-y-1.5", className)}>
      <ControlLabel>{label}</ControlLabel>
      {children}
      {helper ? <div className="pt-1"><ControlHelper>{helper}</ControlHelper></div> : null}
    </label>
  );
}

export function ControlSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-full border border-[--metis-control-border] bg-[--metis-control-bg] px-4 text-sm text-[--metis-text-primary] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] disabled:cursor-not-allowed disabled:border-[--metis-control-disabled-border] disabled:bg-[--metis-control-disabled-bg] disabled:text-[--metis-control-disabled-fg] disabled:shadow-none disabled:opacity-100",
        props.className,
      )}
    />
  );
}

