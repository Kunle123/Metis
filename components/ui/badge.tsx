import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[--metis-outline-strong] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_58%,transparent)] px-3 py-1 text-[0.72rem] font-medium text-[--metis-text-secondary]",
        className,
      )}
      {...props}
    />
  );
}

