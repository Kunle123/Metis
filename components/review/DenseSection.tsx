import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Compact section wrapper for rendered artifacts.
 * Designed to keep consistent heading rhythm without large vertical padding.
 */
export function DenseSection({
  title,
  children,
  className,
  titleClassName,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <section className={cn("space-y-1.5 border-t border-[--metis-outline-subtle] pt-4 first:border-t-0 first:pt-0", className)}>
      <h3 className={cn("text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[--metis-text-tertiary]", titleClassName)}>
        {title}
      </h3>
      <div className="text-sm leading-7 text-[--metis-paper]">{children}</div>
    </section>
  );
}

