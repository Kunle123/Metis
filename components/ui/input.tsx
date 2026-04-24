import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 py-2 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] placeholder:text-[--metis-paper-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

