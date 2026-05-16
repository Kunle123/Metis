import type { ReactNode } from "react";

import type { MessageApprovalStatus } from "@metis/shared/approvalStatus";
import { approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import type { MessageVariantArtifact } from "@metis/shared/messageVariant";
import { approvalStatusBadgeClassNames } from "@/lib/approvals/approvalStatusUi";
import { cn } from "@/lib/utils";

import { messagePurposeLine, messageTemplateDisplayName } from "./messageDraftPresentation";

function MetaPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-[color-mix(in_oklab,var(--metis-status-success-fg)_20%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_40%,transparent)]"
      : tone === "warning"
        ? "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_42%,transparent)]"
        : tone === "info"
          ? "border-[color-mix(in_oklab,var(--metis-info)_18%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_38%,transparent)]"
          : "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)]";

  return (
    <div className={cn("min-w-0 rounded-md border px-2.5 py-1.5", toneClass)}>
      <p className="text-[0.52rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">{label}</p>
      <p className="mt-0.5 truncate text-[0.78rem] font-medium leading-snug text-[--metis-text-primary]">{value}</p>
    </div>
  );
}

export function MessageDraftCard({
  templateId,
  audienceLabel,
  hasSavedDraft,
  savedDraftLabel,
  inSync,
  approvalStatus,
  claimFindingCount,
  purposeLine,
  headline,
  children,
  controls,
  provenanceLine,
  statusNote,
}: {
  templateId: MessageVariantArtifact["templateId"];
  audienceLabel: string;
  hasSavedDraft: boolean;
  savedDraftLabel: string | null;
  inSync: boolean;
  approvalStatus: MessageApprovalStatus | null;
  claimFindingCount: number;
  purposeLine?: string;
  headline: string;
  children: ReactNode;
  controls: ReactNode;
  provenanceLine: string;
  statusNote?: ReactNode;
}) {
  const purpose = purposeLine ?? messagePurposeLine(templateId);

  return (
    <article className="mx-auto min-w-0 max-w-[52rem] overflow-hidden rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_20%,transparent),0_12px_36px_color-mix(in_oklab,var(--metis-frame)_32%,transparent)]">
      <header className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_68%,var(--metis-surface-card))] px-4 py-3.5 sm:px-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-brass-soft]">Message draft</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-base font-semibold leading-snug text-[--metis-text-primary] sm:text-lg">
              {messageTemplateDisplayName(templateId)}
            </h2>
            <p className="text-[0.78rem] text-[--metis-text-secondary]">
              Audience · <span className="text-[--metis-text-primary]">{audienceLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <span className="rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_65%,transparent)] px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-secondary]">
              {hasSavedDraft ? savedDraftLabel : "Preview only"}
            </span>
            {hasSavedDraft ? (
              <MetaPill label="Freshness" value={inSync ? "Up to date" : "Needs refresh"} tone={inSync ? "success" : "warning"} />
            ) : null}
            {hasSavedDraft && approvalStatus ? (
              <span className={cn(approvalStatusBadgeClassNames(approvalStatus), "text-[0.58rem]")}>
                {approvalStatusDisplayLabel(approvalStatus)}
              </span>
            ) : null}
            {hasSavedDraft && claimFindingCount > 0 ? (
              <MetaPill label="Claim alignment" value={`${claimFindingCount} review risk${claimFindingCount === 1 ? "" : "s"}`} tone="warning" />
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-md border border-[color-mix(in_oklab,var(--metis-brass)_22%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_6%,transparent)] px-3 py-2">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Purpose</p>
          <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{purpose}</p>
        </div>

        {statusNote ? <div className="mt-2.5 text-[0.75rem] leading-snug text-[--metis-text-tertiary]">{statusNote}</div> : null}
      </header>

      <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_28%,transparent)] px-4 py-3 sm:px-5">
        {controls}
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <p className="max-w-prose border-l-2 border-[color-mix(in_oklab,var(--metis-brass)_40%,transparent)] pl-3 text-[0.9375rem] font-medium leading-snug text-[--metis-text-primary]">
          {headline}
        </p>
        <div className="rounded-[0.85rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_32%,var(--metis-surface-card))] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
          {children}
        </div>
      </div>

      <footer className="border-t border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)] px-4 py-3 sm:px-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Record basis</p>
        <p className="mt-1 max-w-prose text-[0.75rem] leading-relaxed text-[--metis-text-secondary]">{provenanceLine}</p>
      </footer>
    </article>
  );
}
