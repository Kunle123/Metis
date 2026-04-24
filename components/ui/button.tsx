import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

export function Button({ className, variant = "default", asChild, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f] disabled:pointer-events-none disabled:opacity-50";

  const variantClass =
    variant === "outline"
      ? "border border-white/18 bg-white/[0.07] text-[--metis-paper] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/24 hover:bg-white/[0.12] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:border-white/10 disabled:bg-white/[0.04] disabled:shadow-none"
      : "bg-[--metis-brass] text-[--metis-dark] shadow-[0_2px_10px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/14 hover:bg-[--metis-brass-soft] hover:shadow-[0_3px_12px_rgba(0,0,0,0.45)] disabled:shadow-none disabled:ring-0";

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

