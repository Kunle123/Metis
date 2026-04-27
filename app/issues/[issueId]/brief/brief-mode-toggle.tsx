"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Mode = "full" | "executive";

const tabBase =
  "inline-flex min-h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0e0f]";

const tabActive = "bg-[--metis-brass] font-semibold text-[--metis-dark]";
const tabIdle = "bg-transparent text-[rgba(176,171,160,0.52)] hover:bg-white/[0.06] hover:text-[--metis-paper]";

export function BriefModeToggle({ issueId, mode: serverMode }: { issueId: string; mode: Mode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetMode, setTargetMode] = useState<Mode | null>(null);

  const displayMode: Mode = targetMode ?? serverMode;

  useEffect(() => {
    if (targetMode !== null && serverMode === targetMode) {
      setTargetMode(null);
    }
  }, [serverMode, targetMode]);

  function go(next: Mode) {
    if (next === displayMode) return;
    setTargetMode(next);
    const href = next === "full" ? `/issues/${issueId}/brief?mode=full` : `/issues/${issueId}/brief?mode=executive`;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[0.58rem] font-medium uppercase tracking-[0.22em] text-[--metis-ink-soft]">Brief mode</span>
        {isPending ? (
          <span
            className="inline-flex items-center gap-1.5 text-[0.65rem] text-[--metis-paper-muted]"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[--metis-brass]" aria-hidden />
            <span>Switching…</span>
          </span>
        ) : null}
      </div>
      <div
        role="group"
        aria-label="Brief mode"
        aria-busy={isPending}
        className="inline-flex overflow-hidden rounded-full border border-white/14 bg-[rgba(0,0,0,0.32)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <button
          type="button"
          onClick={() => go("full")}
          aria-current={displayMode === "full" ? "true" : undefined}
          className={cn(tabBase, displayMode === "full" ? tabActive : tabIdle)}
        >
          Full brief
        </button>
        <button
          type="button"
          onClick={() => go("executive")}
          aria-current={displayMode === "executive" ? "true" : undefined}
          className={cn(tabBase, displayMode === "executive" ? tabActive : tabIdle)}
        >
          Executive brief
        </button>
      </div>
    </div>
  );
}
