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
    "border-[--metis-control-border] bg-[--metis-control-bg] shadow-[inset_0_1px_0_var(--metis-control-inset)] enabled:hover:bg-[color-mix(in_oklab,var(--metis-control-bg)_93%,white)] enabled:hover:border-[--metis-control-border-hover]";
  const enabledOnTrack =
    "border-[--metis-action-primary-border] bg-[color-mix(in_oklab,var(--metis-action-primary-bg)_54%,var(--metis-control-bg))] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-[color-mix(in_oklab,var(--metis-action-primary-border)_55%,transparent)] enabled:hover:bg-[color-mix(in_oklab,var(--metis-action-primary-bg)_62%,var(--metis-control-bg))]";
  const disabledTrackOff = "border-[--metis-control-disabled-border] bg-[--metis-control-disabled-bg] shadow-none ring-0";
  const disabledTrackOn =
    "border-[--metis-control-disabled-border] bg-[color-mix(in_oklab,var(--metis-control-disabled-bg)_82%,var(--metis-frame))] shadow-none ring-0";

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
        ? "bg-[--metis-control-disabled-fg]"
        : "bg-[--metis-control-disabled-fg]"
      : checked
        ? "bg-[--metis-control-thumb] shadow-[0_2px_8px_rgba(0,0,0,0.42)]"
        : "bg-[--metis-control-thumb] shadow-[0_1px_5px_rgba(0,0,0,0.38)]";

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
        "disabled:cursor-not-allowed disabled:text-[unset] disabled:opacity-100 disabled:focus-visible:ring-0",
        trackDims,
        track,
        className,
      )}
      {...props}
    >
      <span className={cn("flex min-h-[var(--metis-switch-thumb-size)] w-full items-center", checked ? "justify-end" : "justify-start")}>
        <span
          className={cn(
            "h-[var(--metis-switch-thumb-size)] w-[var(--metis-switch-thumb-size)] shrink-0 rounded-full transition-[background-color,box-shadow] duration-150",
            knob,
          )}
        />
      </span>
    </button>
  );
}
