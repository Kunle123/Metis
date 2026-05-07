"use client";

import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CollapsibleFormPanel({
  title,
  description,
  addLabel,
  defaultExpanded = false,
  children,
  form,
  secondaryAction,
}: {
  title: string;
  description?: string;
  addLabel: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  form: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const regionId = useId();
  const label = useMemo(() => (expanded ? "Hide form" : addLabel), [addLabel, expanded]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">{title}</p>
          {description ? <p className="text-sm leading-6 text-[--metis-paper-muted]">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-4"
            aria-expanded={expanded}
            aria-controls={regionId}
            onClick={() => setExpanded((v) => !v)}
          >
            {label}
          </Button>
          {secondaryAction}
        </div>
      </div>

      <div id={regionId} className={expanded ? "block" : "hidden"} aria-hidden={!expanded}>
        <div className="overflow-hidden rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)] sm:px-5 sm:py-5">
          {form}
        </div>
      </div>

      <div className={cn("space-y-2.5", expanded && "border-t border-[--metis-outline-subtle] pt-5")}>{children}</div>
    </div>
  );
}

