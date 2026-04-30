import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function IconButton({
  label,
  icon,
  variant = "outline",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: ReactNode;
  variant?: "outline" | "default";
}) {
  const base =
    "inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f] disabled:pointer-events-none disabled:cursor-not-allowed";
  const style =
    variant === "outline"
      ? "border border-[--metis-action-secondary-border] bg-[--metis-action-secondary-bg] text-[--metis-action-secondary-fg] shadow-none hover:border-[--metis-outline-strong] hover:bg-[rgba(255,255,255,0.05)] disabled:border-[--metis-action-disabled-border] disabled:bg-[--metis-action-disabled-bg] disabled:text-[--metis-action-disabled-fg] disabled:shadow-none disabled:opacity-100"
      : "border border-[--metis-action-primary-border] bg-[--metis-action-primary-bg] text-[--metis-action-primary-fg] shadow-[0_12px_30px_rgba(0,0,0,0.66)] hover:bg-[--metis-accent-soft] active:translate-y-px disabled:bg-[--metis-action-disabled-bg] disabled:border-[--metis-action-disabled-border] disabled:text-[--metis-action-disabled-fg] disabled:shadow-none disabled:opacity-100 disabled:translate-y-0";
  return (
    <button aria-label={label} title={label} className={cn(base, style, className)} {...props}>
      {icon}
    </button>
  );
}

