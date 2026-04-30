"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import type { BriefMode } from "@metis/shared/briefVersion";
import { SegmentedControl } from "@/components/ui/segmented-control";

export function BriefModeToggle({ issueId, mode: serverMode }: { issueId: string; mode: BriefMode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetMode, setTargetMode] = useState<BriefMode | null>(null);

  const displayMode: BriefMode = targetMode ?? serverMode;

  useEffect(() => {
    if (targetMode !== null && serverMode === targetMode) {
      setTargetMode(null);
    }
  }, [serverMode, targetMode]);

  function go(next: BriefMode) {
    if (next === displayMode) return;
    setTargetMode(next);
    const href = next === "full" ? `/issues/${issueId}/brief?mode=full` : `/issues/${issueId}/brief?mode=executive`;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <SegmentedControl<BriefMode>
        label="Brief mode"
        disabled={isPending}
        value={displayMode}
        options={[
          { id: "full", label: "Full brief" },
          { id: "executive", label: "Executive brief" },
        ]}
        onChange={(next) => go(next)}
        className="w-full min-w-0 sm:w-auto sm:min-w-[260px]"
      />
      {isPending ? (
        <span
          className="inline-flex items-center gap-1.5 text-[0.65rem] text-[--metis-paper-muted]"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[--metis-paper-muted]" aria-hidden />
          <span>Switching…</span>
        </span>
      ) : null}
    </div>
  );
}
