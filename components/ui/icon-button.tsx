import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const disabledInteract = cn(
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100",
  "disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:hover:brightness-100",
  "disabled:hover:shadow-none",
);

function variantStyle(variant: "outline" | "default" | "ghost" | "info") {
  if (variant === "ghost") {
    return cn(
      "border border-transparent bg-transparent text-[--metis-action-ghost-fg] shadow-none ring-0",
      "hover:bg-[color-mix(in_oklab,var(--metis-frame)_96%,transparent)] hover:text-[--metis-text-primary]",
      disabledInteract,
      "disabled:bg-transparent disabled:text-[--metis-action-ghost-disabled-fg] disabled:hover:bg-transparent",
    );
  }
  if (variant === "outline") {
    return cn(
      "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] text-[--metis-action-secondary-fg]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_0_rgba(0,0,0,0.45),0_8px_22px_-10px_rgba(0,0,0,0.75)] ring-0",
      "hover:border-[--metis-action-secondary-hover-border] hover:bg-[--metis-action-secondary-hover-bg]",
      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_0_rgba(0,0,0,0.38),0_10px_26px_-8px_rgba(0,0,0,0.78)]",
      disabledInteract,
      "disabled:border-[--metis-action-secondary-disabled-border] disabled:bg-[--metis-action-secondary-disabled-bg] disabled:text-[--metis-action-secondary-disabled-fg]",
      "disabled:shadow-none disabled:ring-0",
      "disabled:hover:border-[--metis-action-secondary-disabled-border] disabled:hover:bg-[--metis-action-secondary-disabled-bg]",
    );
  }
  if (variant === "info") {
    return cn(
      "border border-[--metis-action-info-border] bg-[--metis-action-info-bg] text-[--metis-action-info-fg]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_rgba(0,0,0,0.35),0_6px_18px_-8px_rgba(0,0,0,0.55)] ring-0",
      "hover:border-[--metis-action-info-hover-border] hover:bg-[--metis-action-info-hover-bg]",
      "focus-visible:ring-[--metis-focus-ring-info]",
      disabledInteract,
      "disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg]",
      "disabled:shadow-none disabled:ring-0",
      "disabled:hover:border-[--metis-action-disabled-border] disabled:hover:bg-[--metis-action-disabled-bg]",
    );
  }
  return cn(
    "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] text-[--metis-action-primary-fg]",
    "shadow-[inset_0_2px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.36),0_12px_32px_-6px_rgba(0,0,0,0.6)]",
    "ring-1 ring-[color-mix(in_oklab,var(--metis-action-primary-border)_76%,transparent)]",
    "hover:-translate-y-px hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.46),0_14px_36px_-6px_rgba(0,0,0,0.68)] hover:brightness-[1.045] active:translate-y-0",
    disabledInteract,
    "disabled:border-[--metis-action-primary-disabled-border] disabled:bg-[--metis-action-primary-disabled-bg] disabled:text-[--metis-action-primary-disabled-fg]",
    "disabled:shadow-none disabled:ring-0 disabled:hover:brightness-100",
    "disabled:hover:border-[--metis-action-primary-disabled-border] disabled:hover:bg-[--metis-action-primary-disabled-bg]",
  );
}

export type IconButtonSize = "sm" | "md" | "lg";

function sizeClasses(s: IconButtonSize) {
  if (s === "sm") {
    return cn(
      "h-[var(--metis-control-height-sm)] min-h-[var(--metis-control-height-sm)] w-[var(--metis-control-height-sm)] min-w-[var(--metis-control-height-sm)] rounded-[var(--metis-control-radius-sm)] [&_svg]:h-[var(--metis-icon-size-sm)] [&_svg]:w-[var(--metis-icon-size-sm)]",
    );
  }
  if (s === "lg") {
    return cn(
      "h-[var(--metis-control-height-lg)] min-h-[var(--metis-control-height-lg)] w-[var(--metis-control-height-lg)] min-w-[var(--metis-control-height-lg)] rounded-[var(--metis-control-radius-md)] [&_svg]:h-[var(--metis-icon-size-lg)] [&_svg]:w-[var(--metis-icon-size-lg)]",
    );
  }
  return cn(
    "h-[var(--metis-control-height-md)] min-h-[var(--metis-control-height-md)] w-[var(--metis-control-height-md)] min-w-[var(--metis-control-height-md)] rounded-[var(--metis-control-radius-md)] [&_svg]:h-[var(--metis-icon-size-md)] [&_svg]:w-[var(--metis-icon-size-md)]",
  );
}

export function IconButton({
  label,
  icon,
  variant = "outline",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  variant?: "outline" | "default" | "ghost" | "info";
  size?: IconButtonSize;
}) {
  const sized = sizeClasses(size);
  const base =
    "inline-flex shrink-0 items-center justify-center p-0 transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--metis-ring-offset)]";

  const style = variantStyle(variant);

  return (
    <button aria-label={label} title={label} className={cn(base, sized, style, className)} {...props}>
      {icon}
    </button>
  );
}
