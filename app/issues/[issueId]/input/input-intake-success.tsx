import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function InputIntakeSuccess({
  message,
  href,
  linkLabel,
}: {
  message: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[1rem] border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_42%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p className="text-sm leading-snug text-[--metis-status-success-fg]">{message}</p>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
