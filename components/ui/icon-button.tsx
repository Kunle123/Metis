import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const disabledAll =
  "disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg] disabled:shadow-none disabled:ring-0 disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:hover:bg-[--metis-action-disabled-bg] disabled:hover:border-[--metis-action-disabled-border] disabled:hover:text-[--metis-action-disabled-fg] disabled:hover:brightness-100";

function variantStyle(variant: "outline" | "default" | "ghost" | "info") {
  if (variant === "ghost") {
    return cn(
      "border border-transparent bg-transparent text-[--metis-action-ghost-fg] shadow-none ring-0",
      "hover:bg-[color-mix(in_oklab,var(--metis-frame)_97%,transparent)] hover:text-[--metis-text-secondary]",
      disabledAll,
    );
  }
  if (variant === "outline") {
    return cn(
      "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] text-[--metis-action-secondary-fg]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-0",
      "hover:border-[--metis-outline-strong] hover:bg-[var(--metis-control-hover-bg)]",
      disabledAll,
    );
  }
  if (variant === "info") {
    return cn(
      "border border-[--metis-info-border] bg-[--metis-info-bg] text-[--metis-paper-muted] shadow-none ring-0",
      "hover:border-[color-mix(in_oklab,var(--metis-info)_52%,transparent)] hover:bg-[color-mix(in_oklab,var(--metis-info-bg)_92%,black)] hover:text-[--metis-text-primary]",
      "focus-visible:ring-[--metis-focus-ring-info]",
      disabledAll,
    );
  }
  return cn(
    "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] text-[--metis-action-primary-fg]",
    "shadow-[inset_0_2px_0_rgba(255,255,255,0.36),inset_0_-1px_0_rgba(0,0,0,0.28),0_12px_30px_-6px_rgba(0,0,0,0.56)]",
    "ring-1 ring-[color-mix(in_oklab,var(--metis-action-primary-border)_72%,transparent)]",
    "hover:-translate-y-px hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.42),0_14px_34px_-6px_rgba(0,0,0,0.62)] hover:brightness-[1.04] active:translate-y-0",
    disabledAll,
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
    "inline-flex shrink-0 items-center justify-center p-0 transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100";

  const style = variantStyle(variant);

  return (
    <button aria-label={label} title={label} className={cn(base, sized, style, className)} {...props}>
      {icon}
    </button>
  );
}
