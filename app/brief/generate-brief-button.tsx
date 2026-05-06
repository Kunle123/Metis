"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BriefMode } from "@metis/shared/briefVersion";

type GenerateBriefButtonProps = {
  issueId: string;
  mode: BriefMode;
  /** Shown when not loading. Defaults to “Generate brief”. */
  label?: string;
  /** One line of status (e.g. in sync with issue vs. stale). */
  syncHint?: string | null;
  /** Align hint + button for toolbar (end) vs workflow step bands (start). */
  hintAlign?: "start" | "end";
  /** Outline when regenerate is optional so reading the brief stays visually primary. */
  variant?: "default" | "outline";
  className?: string;
};

export function GenerateBriefButton({
  issueId,
  mode,
  label = "Generate brief",
  syncHint = null,
  hintAlign = "end",
  variant = "default",
  className,
}: GenerateBriefButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isStart = hintAlign === "start";

  return (
    <div
      className={cn(
        "flex max-w-xl flex-col gap-1",
        isStart ? "items-start [&_button]:self-start" : "max-w-[min(100%,18rem)] items-end sm:max-w-[20rem]",
      )}
    >
      {syncHint ? (
        <p className={cn("text-[0.65rem] leading-snug text-[--metis-paper-muted]", isStart ? "text-left" : "text-right")}>{syncHint}</p>
      ) : null}
      <Button
        pill
        variant={variant === "outline" ? "outline" : "default"}
        className={cn(className)}
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true);
          try {
            await fetch(`/api/issues/${issueId}/brief-versions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ mode }),
            });
          } finally {
            setIsLoading(false);
            router.refresh();
          }
        }}
      >
        {isLoading ? "Generating…" : label}
      </Button>
    </div>
  );
}
