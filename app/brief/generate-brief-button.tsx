"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { BriefMode } from "@metis/shared/briefVersion";

export function GenerateBriefButton({ issueId, mode }: { issueId: string; mode: BriefMode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      className="rounded-full px-5"
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
      {isLoading ? "Generating…" : "Generate brief"}
    </Button>
  );
}

