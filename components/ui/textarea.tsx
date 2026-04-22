import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-7 text-[--metis-paper] placeholder:text-[--metis-paper-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

