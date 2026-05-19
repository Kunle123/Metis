"use client";

import { LockKeyhole } from "lucide-react";

import {
  AiEnhancedBlock,
  RecordGroundedBlock,
  UnsupportedRecordBlock,
} from "@/components/demo/DemoDerivationLayers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoMessageRecord } from "@/lib/demo/towerBriefingDemo";
import { cn } from "@/lib/utils";

function RecordCodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-[color-mix(in_oklab,var(--metis-outline-subtle)_90%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_40%,transparent)] px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide text-[--metis-text-tertiary]">
      {code}
    </span>
  );
}

function approvalTone(status: DemoMessageRecord["approvalStatus"]): "neutral" | "warning" | "success" {
  if (status === "Approved") return "success";
  if (status === "Prepared but not issued" || status === "Ready for review") return "warning";
  return "neutral";
}

export function DemoMessageCard({ message }: { message: DemoMessageRecord }) {
  const approvalClass =
    approvalTone(message.approvalStatus) === "success"
      ? "border-[color-mix(in_oklab,var(--metis-status-success-fg)_20%,transparent)] text-[--metis-status-success-fg]"
      : approvalTone(message.approvalStatus) === "warning"
        ? "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,transparent)] text-[--metis-status-warning-fg]"
        : "border-[--metis-outline-subtle] text-[--metis-text-secondary]";

  return (
    <article className="mx-auto min-w-0 max-w-[52rem] overflow-hidden rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_20%,transparent),0_12px_36px_color-mix(in_oklab,var(--metis-frame)_32%,transparent)]">
      <header className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_68%,var(--metis-surface-card))] px-4 py-3.5 sm:px-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-brass-soft]">Message draft</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base font-semibold leading-snug text-[--metis-text-primary] sm:text-lg">{message.title}</h2>
            <p className="text-[0.78rem] text-[--metis-text-secondary]">
              Audience · <span className="text-[--metis-text-primary]">{message.audience}</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <RecordCodeChip code={message.code} />
            <span className={cn("rounded-md border px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em]", approvalClass)}>
              {message.approvalStatus}
            </span>
            <Badge className="border border-[--metis-outline-subtle] bg-transparent text-[0.58rem] text-[--metis-text-tertiary]">
              {message.freshness === "Current" ? "On file" : "Draft only"}
            </Badge>
            {message.alignmentCue === "Review risk" ? (
              <span className="rounded-md border border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,transparent)] px-2 py-0.5 text-[0.58rem] font-medium text-[--metis-status-warning-fg]">
                Review risk
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-md border border-[color-mix(in_oklab,var(--metis-brass)_18%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_5%,transparent)] px-3 py-2">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Purpose</p>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{message.purposeLine}</p>
        </div>
        <p className="mt-2 text-[0.72rem] text-[--metis-text-tertiary]">
          {message.ownerName} · {message.ownerRole} · {message.timestampLabel}
        </p>
      </header>

      <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_28%,transparent)] px-4 py-3 sm:px-5">
        <Button disabled variant="outline" size="sm" className="h-8 text-[0.72rem] text-[--metis-text-tertiary]">
          <LockKeyhole className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Editing disabled in public demo
        </Button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <RecordGroundedBlock draft={message.recordGroundedDraft} />
        {message.aiEnhancedDraft ? <AiEnhancedBlock draft={message.aiEnhancedDraft} /> : null}
        <UnsupportedRecordBlock
          allowedToSay={message.allowedToSay}
          notSupportedYet={message.notSupportedYet}
          guardrailsApplied={message.guardrailsApplied}
        />

        <details className="rounded-md border border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_75%,transparent)]">
          <summary className="cursor-pointer list-none px-3 py-2 text-[0.72rem] font-medium text-[--metis-text-tertiary] marker:content-none [&::-webkit-details-marker]:hidden">
            Review before use (comms checklist)
          </summary>
          <ul className="space-y-1.5 border-t border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] px-3 py-2">
            {message.reviewBeforeUse.map((item) => (
              <li key={item} className="flex gap-2 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[--metis-text-tertiary]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </details>
      </div>

      <footer className="border-t border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)] px-4 py-3 sm:px-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Record basis</p>
        <p className="mt-1 max-w-prose text-[0.75rem] leading-relaxed text-[--metis-text-secondary]">{message.provenanceLine}</p>
      </footer>
    </article>
  );
}
