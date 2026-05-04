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
  const enabledOffTrack =
    "border-[--metis-control-border] bg-[oklch(0.19_0.018_248)] shadow-[inset_0_2px_5px_rgba(0,0,0,0.55),inset_0_-1px_0_rgba(255,255,255,0.05)] enabled:hover:bg-[oklch(0.21_0.02_248)] enabled:hover:border-[--metis-control-border-hover]";
  const enabledOnTrack =
    "border-[--metis-action-primary-border] bg-[color-mix(in_oklab,var(--metis-action-primary-bg)_58%,var(--metis-control-bg))] shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] ring-1 ring-[color-mix(in_oklab,var(--metis-action-primary-border)_58%,transparent)] enabled:hover:bg-[color-mix(in_oklab,var(--metis-action-primary-bg)_66%,var(--metis-control-bg))]";
  const disabledTrackOff =
    "border border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] shadow-none ring-0 saturate-0";
  const disabledTrackOn =
    "border border-dashed border-[--metis-control-disabled-border] bg-[--metis-surface-disabled] shadow-none ring-0 saturate-0";

  const track =
    disabled === true
      ? checked
        ? disabledTrackOn
        : disabledTrackOff
      : checked
        ? enabledOnTrack
        : enabledOffTrack;

  const knob =
    disabled === true
      ? checked
        ? "bg-[color-mix(in_oklab,var(--metis-control-disabled-fg)_55%,var(--metis-frame))] shadow-none"
        : "bg-[--metis-control-disabled-fg] shadow-none opacity-80"
      : checked
        ? "bg-[--metis-control-thumb] shadow-[0_2px_8px_rgba(0,0,0,0.48)]"
        : "bg-[--metis-control-thumb] shadow-[0_1px_5px_rgba(0,0,0,0.42)]";

  const trackDims = cn(
    "h-[var(--metis-switch-track-height)] min-h-[var(--metis-switch-track-height)] max-h-[var(--metis-switch-track-height)] w-[var(--metis-switch-track-width)] min-w-[var(--metis-switch-track-width)] max-w-[var(--metis-switch-track-width)] p-[var(--metis-switch-padding)]",
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? "Toggle"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex shrink-0 items-center rounded-[var(--metis-control-radius-pill)] border transition-[background-color,border-color,box-shadow,filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring]",
        "disabled:cursor-not-allowed disabled:text-[unset] disabled:opacity-100 disabled:focus-visible:ring-0 disabled:hover:shadow-none",
        trackDims,
        track,
        className,
      )}
      {...props}
    >
      <span className={cn("flex min-h-[var(--metis-switch-thumb-size)] w-full items-center", checked ? "justify-end" : "justify-start")}>
        <span
          className={cn(
            "h-[var(--metis-switch-thumb-size)] w-[var(--metis-switch-thumb-size)] shrink-0 rounded-full transition-[background-color,box-shadow,opacity] duration-150",
            knob,
          )}
        />
      </span>
    </button>
  );
}
