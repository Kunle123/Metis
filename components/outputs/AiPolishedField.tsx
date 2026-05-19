import type { ReactNode } from "react";

import {
  AI_POLISHED_FIELD_CLASSNAMES,
  OUTPUT_WORDING_COPY,
} from "@/lib/outputs/outputWordingMode";
import { cn } from "@/lib/utils";

export function AiPolishedFieldChip() {
  return (
    <span className="mb-2 inline-flex items-center rounded border border-[color-mix(in_oklab,var(--metis-status-info-fg)_28%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_65%,transparent)] px-1.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.08em] text-[--metis-status-info-fg]">
      {OUTPUT_WORDING_COPY.fieldChip}
    </span>
  );
}

export function AiPolishedField({
  active,
  children,
  className,
  showHelper = true,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  showHelper?: boolean;
}) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(AI_POLISHED_FIELD_CLASSNAMES, className)}>
      <AiPolishedFieldChip />
      {children}
      {showHelper ? (
        <p className="mt-2 text-[0.62rem] leading-snug text-[--metis-text-tertiary]">
          {OUTPUT_WORDING_COPY.fieldHelper}
        </p>
      ) : null}
    </div>
  );
}
