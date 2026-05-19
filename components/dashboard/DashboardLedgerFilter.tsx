import Link from "next/link";

import { cn } from "@/lib/utils";
import type { IssueLedger } from "@/lib/issues/issueLifecycle";

export function DashboardLedgerFilter({ ledger }: { ledger: IssueLedger }) {
  const segments: { id: IssueLedger; label: string; href: string }[] = [
    { id: "active", label: "Active", href: "/" },
    { id: "archived", label: "Archived", href: "/?ledger=archived" },
  ];

  return (
    <div
      role="group"
      aria-label="Issue register filter"
      className="inline-flex h-[var(--metis-control-height-md)] items-stretch rounded-[var(--metis-control-radius-lg)] border border-[--metis-segmented-rail-border] bg-[--metis-segmented-rail-bg] p-[var(--metis-segmented-rail-padding)] shadow-[inset_0_1px_4px_color-mix(in_oklab,black_35%,transparent)]"
    >
      {segments.map((s) => {
        const selected = ledger === s.id;
        return (
          <Link
            key={s.id}
            href={s.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "flex min-h-[var(--metis-segmented-slot-height)] flex-1 items-center justify-center rounded-[var(--metis-control-radius-md)] px-[var(--metis-control-padding-x-sm)] text-sm font-medium transition",
              selected
                ? "border border-[--metis-control-active-border] bg-[--metis-control-active-bg] text-[--metis-text-primary] shadow-[inset_0_1px_0_color-mix(in_oklab,white_20%,transparent)]"
                : "border border-transparent text-[--metis-text-secondary] hover:border-[--metis-outline-subtle] hover:bg-[color-mix(in_oklab,var(--metis-control-hover-bg)_70%,transparent)] hover:text-[--metis-text-primary]",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
