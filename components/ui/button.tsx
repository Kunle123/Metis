import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Fully rounded capsule; default controls use `--metis-control-radius-md`. */
  pill?: boolean;
  asChild?: boolean;
};

/** Shared disabled surface: kills variant hovers/shadow/transform for every variant */
const disabledAll =
  "disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg] disabled:shadow-none disabled:hover:shadow-none disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:hover:bg-[--metis-action-disabled-bg] disabled:hover:border-[--metis-action-disabled-border] disabled:hover:text-[--metis-action-disabled-fg] disabled:hover:brightness-100 disabled:[filter:none]";

function sizeClasses(s: ButtonSize) {
  if (s === "sm") {
    return cn(
      "min-h-[var(--metis-control-height-sm)] h-[var(--metis-control-height-sm)] px-[var(--metis-control-padding-x-sm)] gap-[var(--metis-control-gap-md)] text-sm",
      "[&_svg:not([class*='size-'])]:h-[var(--metis-icon-size-sm)] [&_svg:not([class*='size-'])]:w-[var(--metis-icon-size-sm)] [&_svg:not([class*='size-'])]:shrink-0",
    );
  }
  if (s === "lg") {
    return cn(
      "min-h-[var(--metis-control-height-lg)] h-[var(--metis-control-height-lg)] px-[var(--metis-control-padding-x-lg)] gap-[var(--metis-control-gap-lg)] text-base",
      "[&_svg:not([class*='size-'])]:h-[var(--metis-icon-size-lg)] [&_svg:not([class*='size-'])]:w-[var(--metis-icon-size-lg)] [&_svg:not([class*='size-'])]:shrink-0",
    );
  }
  return cn(
    "min-h-[var(--metis-control-height-md)] h-[var(--metis-control-height-md)] px-[var(--metis-control-padding-x-md)] gap-[var(--metis-control-gap-md)] text-sm",
    "[&_svg:not([class*='size-'])]:h-[var(--metis-icon-size-md)] [&_svg:not([class*='size-'])]:w-[var(--metis-icon-size-md)] [&_svg:not([class*='size-'])]:shrink-0",
  );
}

export function Button({ className, variant = "default", size = "md", pill = false, asChild, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100";

  const radius =
    pill === true ? "rounded-[var(--metis-control-radius-pill)]" : "rounded-[var(--metis-control-radius-md)]";

  const variantClass =
    variant === "ghost"
      ? cn(
          "border border-transparent bg-transparent text-[--metis-action-ghost-fg] shadow-none ring-0 hover:bg-[color-mix(in_oklab,var(--metis-frame)_94%,transparent)] hover:text-[--metis-text-secondary] active:bg-[color-mix(in_oklab,var(--metis-frame)_88%,transparent)]",
          disabledAll,
        )
      : variant === "outline"
        ? cn(
            "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] text-[--metis-action-secondary-fg] shadow-none ring-0 hover:border-[--metis-outline-strong] hover:bg-[var(--metis-control-hover-bg)]",
            disabledAll,
          )
        : cn(
            "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] text-[--metis-action-primary-fg]",
            "shadow-[inset_0_2px_0_rgba(255,255,255,0.32),inset_0_-1px_0_rgba(0,0,0,0.28),0_14px_34px_-6px_rgba(0,0,0,0.58)] hover:-translate-y-px hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.38),inset_0_-1px_0_rgba(0,0,0,0.22),0_17px_40px_-6px_rgba(0,0,0,0.64)] hover:brightness-[1.03] active:translate-y-0 active:brightness-[1.02]",
            disabledAll,
          );

  const sized = sizeClasses(size);

  if (asChild) {
    const child = React.Children.only(props.children) as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(base, radius, sized, variantClass, className, child.props.className),
    });
  }

  return <button className={cn(base, radius, sized, variantClass, className)} {...props} />;
}
