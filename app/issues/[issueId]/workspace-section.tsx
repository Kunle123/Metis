"use client";

import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export function WorkspaceSection({
  title,
  description,
  addLabel,
  advancedHref,
  defaultExpanded = false,
  children,
  form,
}: {
  title: string;
  description: string;
  addLabel: string;
  advancedHref: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  form: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const regionId = useId();
  const label = useMemo(() => (expanded ? "Hide form" : addLabel), [addLabel, expanded]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">{title}</p>
          <p className="text-sm leading-6 text-[--metis-paper-muted]">{description}</p>
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
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
          >
            <a href={advancedHref}>Advanced view</a>
          </Button>
        </div>
      </div>

      <div id={regionId} className={expanded ? "block" : "hidden"} aria-hidden={!expanded}>
        <div className="rounded-[1.25rem] border border-white/8 bg-[rgba(0,0,0,0.14)] px-5 py-5">
          {form}
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

