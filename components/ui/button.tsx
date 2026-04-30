import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

export function Button({ className, variant = "default", asChild, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f] disabled:pointer-events-none disabled:cursor-not-allowed";

  const variantClass =
    variant === "outline"
      ? "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] text-[--metis-action-secondary-fg] shadow-none hover:border-[--metis-outline-strong] hover:bg-[rgba(255,255,255,0.05)] disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg] disabled:opacity-100"
      : "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] text-[--metis-action-primary-fg] shadow-[0_12px_30px_rgba(0,0,0,0.66)] hover:bg-[--metis-accent-soft] hover:shadow-[0_16px_36px_rgba(0,0,0,0.72)] active:translate-y-px disabled:bg-[--metis-action-disabled-bg] disabled:border-[--metis-action-disabled-border] disabled:text-[--metis-action-disabled-fg] disabled:shadow-none disabled:opacity-100 disabled:translate-y-0";

  if (asChild) {
    // Minimal "asChild" support: allow passing an <a> via children with className applied.
    // This avoids adding a slot library in Sprint 0.
    const child = React.Children.only(props.children) as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(base, variantClass, className, child.props.className),
    });
  }

  return <button className={cn(base, variantClass, className)} {...props} />;
}

