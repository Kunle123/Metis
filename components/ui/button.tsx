import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost" | "info";

type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Fully rounded capsule; default controls use `--metis-control-radius-md`. */
  pill?: boolean;
  asChild?: boolean;
};

/** Behaviour-only: each variant supplies its own disabled surface tokens */
const disabledInteract = cn(
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100",
  "disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:hover:brightness-100 disabled:[filter:none] disabled:no-underline",
  "disabled:hover:shadow-none",
);

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

function variantClassFor(variant: ButtonVariant) {
  if (variant === "ghost") {
    return cn(
      "border border-transparent bg-transparent font-normal text-[--metis-action-ghost-fg] shadow-none ring-0 underline-offset-[0.2em]",
      "hover:text-[--metis-text-primary] hover:underline hover:decoration-[color-mix(in_oklab,var(--metis-paper-muted)_65%,transparent)]",
      "active:text-[--metis-text-secondary]",
      disabledInteract,
      "disabled:bg-transparent disabled:border-transparent disabled:text-[--metis-action-ghost-disabled-fg] disabled:shadow-none disabled:ring-0",
      "disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-[--metis-action-ghost-disabled-fg]",
    );
  }
  if (variant === "outline") {
    return cn(
      "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] font-medium text-[--metis-action-secondary-fg]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_0_rgba(0,0,0,0.45),0_8px_22px_-10px_rgba(0,0,0,0.75)] ring-0",
      "hover:border-[--metis-action-secondary-hover-border] hover:bg-[--metis-action-secondary-hover-bg]",
      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_0_rgba(0,0,0,0.38),0_10px_26px_-8px_rgba(0,0,0,0.78)]",
      disabledInteract,
      "disabled:border-[--metis-action-secondary-disabled-border] disabled:bg-[--metis-action-secondary-disabled-bg] disabled:text-[--metis-action-secondary-disabled-fg]",
      "disabled:shadow-none disabled:ring-0",
      "disabled:hover:border-[--metis-action-secondary-disabled-border] disabled:hover:bg-[--metis-action-secondary-disabled-bg] disabled:hover:text-[--metis-action-secondary-disabled-fg]",
    );
  }
  if (variant === "info") {
    return cn(
      "border border-[--metis-action-info-border] bg-[--metis-action-info-bg] font-medium text-[--metis-action-info-fg]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_rgba(0,0,0,0.35),0_6px_18px_-8px_rgba(0,0,0,0.55)] ring-0",
      "hover:border-[--metis-action-info-hover-border] hover:bg-[--metis-action-info-hover-bg]",
      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_1px_0_rgba(0,0,0,0.28),0_8px_22px_-8px_rgba(0,0,0,0.6)]",
      "focus-visible:ring-[--metis-focus-ring-info]",
      disabledInteract,
      "disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg]",
      "disabled:shadow-none disabled:ring-0",
      "disabled:hover:border-[--metis-action-disabled-border] disabled:hover:bg-[--metis-action-disabled-bg] disabled:hover:text-[--metis-action-disabled-fg]",
    );
  }
  return cn(
    "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] font-semibold text-[--metis-action-primary-fg]",
    "shadow-[inset_0_2px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(0,0,0,0.38),0_14px_36px_-6px_rgba(0,0,0,0.62)]",
    "ring-1 ring-[color-mix(in_oklab,var(--metis-action-primary-border)_76%,transparent)]",
    "hover:-translate-y-px hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.48),inset_0_-1px_0_rgba(0,0,0,0.26),0_18px_44px_-6px_rgba(0,0,0,0.72)] hover:brightness-[1.045]",
    "active:translate-y-0 active:brightness-[1.03]",
    disabledInteract,
    "disabled:border-[--metis-action-primary-disabled-border] disabled:bg-[--metis-action-primary-disabled-bg] disabled:text-[--metis-action-primary-disabled-fg]",
    "disabled:shadow-none disabled:ring-0 disabled:brightness-100 disabled:hover:brightness-100",
    "disabled:hover:border-[--metis-action-primary-disabled-border] disabled:hover:bg-[--metis-action-primary-disabled-bg] disabled:hover:text-[--metis-action-primary-disabled-fg]",
  );
}

export function Button({ className, variant = "default", size = "md", pill = false, asChild, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform,filter,text-decoration] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f]";

  const radius =
    pill === true ? "rounded-[var(--metis-control-radius-pill)]" : "rounded-[var(--metis-control-radius-md)]";

  const variantClass = variantClassFor(variant);

  const sized = sizeClasses(size);

  if (asChild) {
    const child = React.Children.only(props.children) as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(base, radius, sized, variantClass, className, child.props.className),
    });
  }

  return <button className={cn(base, radius, sized, variantClass, className)} {...props} />;
}
