import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

export function Button({ className, variant = "default", asChild, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 disabled:pointer-events-none disabled:opacity-50";

  const variantClass =
    variant === "outline"
      ? "border border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
      : "bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]";

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

