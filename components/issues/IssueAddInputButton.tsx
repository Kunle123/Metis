import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { issueAddInputHref } from "@/lib/issues/issueNav";
import { cn } from "@/lib/utils";

export function IssueAddInputButton({
  issueRoutePrefix,
  className,
  variant = "default",
  size = "md",
}: {
  issueRoutePrefix: string;
  className?: string;
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Button asChild variant={variant} size={size} className={cn("rounded-full", className)}>
      <Link href={issueAddInputHref(issueRoutePrefix)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden />
        Add input
      </Link>
    </Button>
  );
}
