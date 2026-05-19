import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/** Secondary navigation back to the issue record home (`/issues/:id`). */
export function BackToIssueRecordLink({ issueId, className }: { issueId: string; className?: string }) {
  return (
    <Link
      href={`/issues/${issueId}`}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-sm text-[0.8rem] font-medium text-[--metis-text-tertiary] underline-offset-4 transition hover:text-[--metis-paper] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[--metis-ring-offset]",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      Back to issue record
    </Link>
  );
}
