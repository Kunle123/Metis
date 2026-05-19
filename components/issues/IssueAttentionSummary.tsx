import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SurfaceCard } from "@/components/MetisShell";
import { cn } from "@/lib/utils";
import type { IssueAttentionItem } from "@/lib/issues/issueAttentionSummary";

function toneAccentClass(tone: IssueAttentionItem["tone"]) {
  switch (tone) {
    case "critical":
      return "border-[--metis-status-danger-border]";
    case "warning":
      return "border-[--metis-status-warning-border]";
    case "info":
      return "border-[--metis-info-border]";
    case "success":
      return "border-[--metis-status-success-border]";
    default:
      return "border-[--metis-outline-subtle]";
  }
}

function IssueAttentionSummaryBody({
  attentionItems,
  variant,
}: {
  attentionItems: IssueAttentionItem[];
  variant: "card" | "embedded";
}) {
  const hasAttention = attentionItems.length > 0;

  return (
    <>
      <div
        className={cn(
          variant === "embedded"
            ? "space-y-1"
            : "border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-6 py-4 sm:px-7",
        )}
      >
        <h3
          className={cn(
            "font-[Cormorant_Garamond] leading-tight text-[--metis-paper]",
            variant === "embedded" ? "text-[1.35rem]" : "text-[1.45rem]",
          )}
        >
          Needs attention
        </h3>
        <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">Review these before briefing or circulating.</p>
      </div>

      <div className={cn(variant === "embedded" ? "pt-4" : "px-6 py-5 sm:px-7")}>
        {!hasAttention ? (
          <div className="flex gap-4 rounded-xl border border-[--metis-status-success-border]/70 bg-[color-mix(in_oklab,var(--metis-status-success-bg)_28%,transparent)] px-4 py-4 sm:px-5">
            <CheckCircle2
              aria-hidden
              className="mt-0.5 h-6 w-6 shrink-0 text-[--metis-status-success-fg] opacity-[0.88]"
              strokeWidth={1.75}
            />
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-[--metis-paper]">No immediate attention items</p>
              <p className="text-sm leading-6 text-[--metis-paper-muted]">
                The issue record, claims and saved outputs look aligned based on current checks.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[--metis-outline-subtle]/80">
            {attentionItems.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div
                  className={cn(
                    "rounded-xl border bg-[color-mix(in_oklab,var(--metis-surface-card)_92%,transparent)] px-4 py-3.5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)] sm:px-5",
                    toneAccentClass(item.tone),
                  )}
                >
                  <p className="text-sm font-medium leading-6 text-[--metis-paper]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{item.description}</p>
                  <div className="mt-3 flex flex-wrap">
                    <Link
                      href={item.href}
                      className="rounded-sm text-sm font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45 break-words"
                    >
                      {item.linkLabel}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function IssueAttentionSummaryCard({
  attentionItems,
  className,
  variant = "card",
}: {
  attentionItems: IssueAttentionItem[];
  className?: string;
  variant?: "card" | "embedded";
}) {
  const body = <IssueAttentionSummaryBody attentionItems={attentionItems} variant={variant} />;

  if (variant === "embedded") {
    return (
      <section className={cn("border-t border-[--metis-outline-subtle] pt-6", className)} aria-label="Needs attention">
        {body}
      </section>
    );
  }

  return (
    <SurfaceCard className={cn("min-w-0 overflow-hidden", className)}>
      {body}
    </SurfaceCard>
  );
}
