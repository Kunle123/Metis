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
  className?: string;
};

export function GenerateBriefButton({
  issueId,
  mode,
  label = "Generate brief",
  syncHint = null,
  className,
}: GenerateBriefButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex max-w-[min(100%,18rem)] flex-col items-end gap-1 sm:max-w-[20rem]">
      {syncHint ? <p className="text-right text-[0.65rem] leading-snug text-[--metis-paper-muted]">{syncHint}</p> : null}
      <Button
        pill
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
