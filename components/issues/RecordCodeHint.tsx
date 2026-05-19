import type { ReactNode } from "react";

import { truncateForTooltip } from "@/lib/ui/truncateForTooltip";
import { cn } from "@/lib/utils";

/**
 * Wraps a record code chip (`SRC-001`, `Q-001`, `CLM-001`) with a native tooltip
 * (`title` + `aria-label`) — no custom tooltip layer for this slice.
 */
export function RecordCodeHint({
  codeLabel,
  hint,
  className,
  children,
}: {
  codeLabel: string;
  hint: string | null | undefined;
  className?: string;
  children: ReactNode;
}) {
  const tooltip = hint ? truncateForTooltip(hint) : "";
  if (!tooltip) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={cn(className)} title={tooltip} aria-label={`${codeLabel}: ${tooltip}`}>
      {children}
    </span>
  );
}
