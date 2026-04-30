import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  "aria-label": ariaLabel,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  const track =
    disabled
      ? checked
        ? "border-[--metis-control-disabled-border] bg-[rgba(255,255,255,0.04)]"
        : "border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg]"
      : checked
        ? "border-[--metis-control-active-border] bg-[rgba(224,183,111,0.34)]"
        : "border-[--metis-control-border] bg-[--metis-control-bg]";

  const knob =
    disabled
      ? checked
        ? "bg-[rgba(255,255,255,0.26)]"
        : "bg-[rgba(255,255,255,0.22)]"
      : checked
        ? "bg-[--metis-action-primary-bg]"
        : "bg-[--metis-control-thumb]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? "Toggle"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-8 w-[3.25rem] items-center rounded-full border p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] disabled:cursor-not-allowed disabled:opacity-100 disabled:focus-visible:ring-0",
        track,
        className,
      )}
      {...props}
    >
      <span className={cn("flex w-full", checked ? "justify-end" : "justify-start")}>
        <span className={cn("h-6 w-6 rounded-full transition", knob)} />
      </span>
    </button>
  );
}

