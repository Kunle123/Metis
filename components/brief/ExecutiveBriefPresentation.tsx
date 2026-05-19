"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { AiPolishedField } from "@/components/outputs/AiPolishedField";
import { OutputWordingModeBar } from "@/components/outputs/OutputWordingModeBar";
import {
  buildExecutivePolishedFields,
  canSelectExecutiveAiPolishedMode,
  executiveBriefWordingCompareDeterministicBody,
  isFieldShowingAiPolished,
  shouldShowExecutiveBriefWordingControl,
  type ExecutiveBriefWordingMode,
} from "@/lib/brief/executiveBriefWordingMode";
import { ExecutiveBriefSection } from "@/components/brief/ExecutiveBriefSection";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import type {
  ExecutiveBriefLineItem,
  ExecutiveBriefPresentationModel,
} from "@/lib/brief/parseExecutiveBriefPresentation";
import { filterParagraphsNotInBody, isNearDuplicateSentence } from "@/lib/brief/executiveNarrativeSanitize";
import {
  parseExecutiveLineItem,
  slicePresentationItems,
} from "@/lib/brief/parseExecutiveBriefPresentation";
import { cn } from "@/lib/utils";

const PROSE_RESET =
  "[&_p]:m-0 [&_p]:text-[0.875rem] [&_p]:leading-[1.7] [&_p]:text-[--metis-text-secondary] [&_a]:text-[--metis-text-secondary] [&_a]:no-underline [&_a:hover]:text-[--metis-brass-soft] [&_strong]:font-medium [&_strong]:text-[--metis-text-primary]";

const RECORD_SLICE_MAX = 5;

function formatShortDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function splitExecutiveSummary(body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { narrative: "", whyItMatters: null as string | null };
  const parts = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const whyIdx = parts.findIndex((p) => /^why it matters:/i.test(p));
  if (whyIdx >= 0) {
    const why = parts[whyIdx]!.replace(/^why it matters:\s*/i, "").trim();
    const narrative = [...parts.slice(0, whyIdx), ...parts.slice(whyIdx + 1)].join("\n\n");
    return { narrative, whyItMatters: why || null };
  }
  return { narrative: trimmed, whyItMatters: null };
}

function lineKey(item: ExecutiveBriefLineItem): string {
  return item.code ? item.code.toUpperCase() : item.text.toLowerCase();
}

function dedupeLineItems(items: ExecutiveBriefLineItem[]): ExecutiveBriefLineItem[] {
  const seen = new Set<string>();
  const out: ExecutiveBriefLineItem[] = [];
  for (const it of items) {
    const k = lineKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function StatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "amber" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em]",
        tone === "amber" &&
          "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,transparent)] text-[--metis-status-warning-fg]",
        tone === "outline" && "border-[--metis-outline-subtle] text-[--metis-text-tertiary]",
        tone === "neutral" &&
          "border-[color-mix(in_oklab,var(--metis-brass)_18%,var(--metis-outline-subtle))] text-[--metis-text-secondary]",
      )}
    >
      {children}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] pb-2">
      <p className="text-[0.52rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">{label}</p>
      <p className="mt-0.5 text-[0.78rem] font-medium leading-snug text-[--metis-text-primary]">{value}</p>
    </div>
  );
}

function RecordCodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-[color-mix(in_oklab,var(--metis-outline-subtle)_90%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_40%,transparent)] px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide text-[--metis-text-tertiary]">
      {code}
    </span>
  );
}

function RecordLine({ item }: { item: ExecutiveBriefLineItem | string }) {
  const parsed = typeof item === "string" ? parseExecutiveLineItem(item) : item;
  return (
    <li className="flex min-w-0 gap-2.5 py-2 first:pt-0">
      <span
        className="mt-[0.45rem] h-px w-3 shrink-0 bg-[color-mix(in_oklab,var(--metis-outline-strong)_55%,transparent)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-1">
        {parsed.code ? <RecordCodeChip code={parsed.code} /> : null}
        <p className="text-[0.8125rem] leading-[1.55] text-[--metis-text-secondary]">{parsed.text}</p>
      </div>
    </li>
  );
}

function RecordList({
  items,
  emptyLabel,
  remainder,
}: {
  items: (ExecutiveBriefLineItem | string)[];
  emptyLabel: string;
  remainder?: number;
}) {
  if (!items.length) {
    return <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-tertiary]">{emptyLabel}</p>;
  }
  return (
    <>
      <ul className="space-y-0">
        {items.map((item) => (
          <RecordLine key={typeof item === "string" ? item : `${item.code ?? "x"}-${item.text}`} item={item} />
        ))}
      </ul>
      {remainder && remainder > 0 ? (
        <p className="mt-2 text-[0.72rem] text-[--metis-text-tertiary]">+{remainder} more on the register</p>
      ) : null}
    </>
  );
}

function RecordPanel({
  title,
  chip,
  accent,
  description,
  items,
  emptyLabel,
  max = RECORD_SLICE_MAX,
}: {
  title: string;
  chip: ReactNode;
  accent: "none" | "brass" | "amber" | "slate";
  description?: string;
  items: ExecutiveBriefLineItem[];
  emptyLabel: string;
  max?: number;
}) {
  const { shown, remainder } = slicePresentationItems(items, max);
  return (
    <ExecutiveBriefSection variant="neutral" accent={accent} compact title={title} description={description}>
      <div className="mb-2.5">{chip}</div>
      <RecordList items={shown} emptyLabel={emptyLabel} remainder={remainder} />
    </ExecutiveBriefSection>
  );
}

export function ExecutiveBriefPresentation({
  model,
  issueId,
  briefVersionLabel,
  briefInSync,
  briefGeneratedAt,
  issueUpdatedAt,
  executiveExecAlternateWording,
  briefAiSynthesisEnabled,
  polishPreview,
  executiveSummaryStoredBody,
}: {
  model: ExecutiveBriefPresentationModel;
  issueId: string;
  briefVersionLabel: string;
  briefInSync: boolean;
  briefGeneratedAt?: Date;
  issueUpdatedAt: Date;
  executiveExecAlternateWording: NormalizedAlternateWording;
  briefAiSynthesisEnabled: boolean;
  polishPreview?: { issueId: string; briefVersionId: string; hasExistingAlternate: boolean } | null;
  /** Raw Executive summary block body from the stored artifact (compare target). */
  executiveSummaryStoredBody: string;
}) {
  const ownerForDecision = (owner: string | null) => {
    if (owner && !/not recorded|not assigned/i.test(owner)) return owner;
    return "Owner not assigned";
  };

  const [wordingMode, setWordingMode] = useState<ExecutiveBriefWordingMode>("stored");
  const [previewPolishedBody, setPreviewPolishedBody] = useState<string | null>(null);

  const { narrative, whyItMatters } = splitExecutiveSummary(model.position.executiveSummary);
  const executiveSummaryBody = narrative.trim() || model.position.executiveSummary.trim();
  const storedCurrentPositionBody = executiveBriefWordingCompareDeterministicBody({
    executiveSummaryStoredBody,
    presentationExecutiveSummary: executiveSummaryBody || model.position.executiveSummary,
  });

  const polishedFields = buildExecutivePolishedFields({
    alternateWording: executiveExecAlternateWording,
    previewPolishedBody,
    storedCurrentPositionBody,
  });

  const canSelectAiPolished = canSelectExecutiveAiPolishedMode(polishedFields);
  const showWordingControl = shouldShowExecutiveBriefWordingControl({
    briefAiSynthesisEnabled,
    hasBriefVersion: Boolean(polishPreview),
  });

  const isCurrentPositionAi = isFieldShowingAiPolished({
    mode: wordingMode,
    field: "currentPosition",
    polishedFields,
  });

  const storedNarrative = executiveSummaryBody;
  const aiPositionSplit = polishedFields.currentPosition
    ? splitExecutiveSummary(polishedFields.currentPosition)
    : { narrative: "", whyItMatters: null as string | null };

  const displayNarrative = isCurrentPositionAi
    ? aiPositionSplit.narrative.trim() || polishedFields.currentPosition?.trim() || ""
    : storedNarrative;

  const displayWhyItMatters = isCurrentPositionAi ? aiPositionSplit.whyItMatters : whyItMatters;

  useEffect(() => {
    if (wordingMode === "ai-polished" && !canSelectAiPolished) {
      setWordingMode("stored");
    }
  }, [wordingMode, canSelectAiPolished]);

  const assumptionItems = dedupeLineItems(model.claimGroups.filter((g) => g.id === "assumptions").flatMap((g) => g.items));
  const needsValidationItems = dedupeLineItems(
    model.claimGroups.filter((g) => g.id === "needsValidation").flatMap((g) => g.items),
  );
  const nonConfirmedKeys = new Set([...assumptionItems, ...needsValidationItems].map(lineKey));

  const confirmedClaims = dedupeLineItems(
    model.claimGroups.filter((g) => g.id === "confirmed").flatMap((g) => g.items),
  ).filter((it) => !nonConfirmedKeys.has(lineKey(it)));

  const confirmedFactsAsItems = model.confirmedFacts.map((f) => parseExecutiveLineItem(f));
  const confirmedClaimsDeduped = confirmedClaims.filter(
    (claim) => !confirmedFactsAsItems.some((fact) => isNearDuplicateSentence(fact.text, claim.text)),
  );
  const confirmedCombined = dedupeLineItems([...confirmedFactsAsItems, ...confirmedClaimsDeduped]);

  const cautionCombined = dedupeLineItems([...assumptionItems, ...needsValidationItems]);

  const openQuestionsAsItems = model.openQuestions.map((q) => parseExecutiveLineItem(q));

  const { shown: safeShown, remainder: safeRemainder } = slicePresentationItems(model.safeToSay, RECORD_SLICE_MAX);
  const { shown: holdShown, remainder: holdRemainder } = slicePresentationItems(model.doNotSayYet, RECORD_SLICE_MAX);

  const statusCaveat = /caveat/i.test(model.header.status) || /provisional/i.test(model.header.status);

  const recordSufficiencyParagraphs = model.position.recordSufficiency
    ? filterParagraphsNotInBody(
        model.position.recordSufficiency.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
        executiveSummaryBody,
      )
    : [];

  const showLede =
    model.position.lede.trim().length > 0 &&
    !recordSufficiencyParagraphs.some((p) => isNearDuplicateSentence(model.position.lede, p)) &&
    !isNearDuplicateSentence(model.position.lede, executiveSummaryBody);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[72rem]">
      <article className="min-w-0 overflow-hidden rounded-[0.85rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_15%,transparent)]">
        <header className="border-b border-[--metis-outline-subtle] px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-3xl space-y-1">
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Executive brief</p>
              <h2 className="text-lg font-semibold leading-snug tracking-tight text-[--metis-text-primary] sm:text-[1.35rem]">
                {model.header.title}
              </h2>
            </div>
            <Badge
              className={cn(
                "shrink-0 border-[--metis-outline-subtle] text-[0.68rem] font-medium",
                !briefInSync && "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_25%,transparent)]",
              )}
            >
              {briefInSync ? "Up to date" : "Needs refresh"}
            </Badge>
          </div>

          <p className="mt-2 max-w-prose text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
            {model.header.status}
            <span className="text-[--metis-text-tertiary]"> · </span>
            {model.header.briefingPosture}
          </p>

          <div
            className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6"
            role="list"
            aria-label="Brief metadata"
          >
            <MetaChip label="Severity" value={model.header.severity} />
            <MetaChip label="Urgency" value={model.header.urgency} />
            <MetaChip label="Open questions" value={model.header.openGapsLabel} />
            <MetaChip label="Owner" value={model.header.owner} />
            <MetaChip label="Version" value={briefVersionLabel} />
            <MetaChip label="Circulation" value={model.header.circulation} />
          </div>

          {statusCaveat ? (
            <p className="mt-3 text-[0.72rem] text-[--metis-status-warning-fg]">Briefing carries explicit caveats — validate before external use.</p>
          ) : null}

          <p className="mt-3 text-[0.68rem] text-[--metis-text-tertiary]">
            {briefGeneratedAt ? `Generated ${formatShortDate(briefGeneratedAt)}` : `Issue updated ${formatShortDate(issueUpdatedAt)}`}
            <span aria-hidden> · </span>
            {model.header.lastRevisionLabel}
          </p>
        </header>

        {showWordingControl && polishPreview ? (
          <OutputWordingModeBar
            wordingMode={wordingMode}
            onWordingModeChange={setWordingMode}
            canSelectAiPolished={canSelectAiPolished}
            polishPreview={{
              issueId: polishPreview.issueId,
              briefVersionId: polishPreview.briefVersionId,
              request: { mode: "executive", scope: "executive-summary" },
            }}
            onPreviewReady={(text) => setPreviewPolishedBody(text)}
          />
        ) : null}

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
            <ExecutiveBriefSection variant="emphasis" accent="brass" eyebrow="Read first" title="Current position">
              {recordSufficiencyParagraphs.length ? (
                <div className="mb-4 max-w-[42rem] space-y-2.5">
                  {recordSufficiencyParagraphs.map((para) => (
                    <p key={para.slice(0, 48)} className="text-[0.9375rem] leading-[1.6] text-[--metis-text-primary]">
                      {para}
                    </p>
                  ))}
                </div>
              ) : showLede ? (
                <p className="mb-4 max-w-[42rem] text-[0.9375rem] font-medium leading-[1.6] text-[--metis-text-primary]">
                  {model.position.lede}
                </p>
              ) : null}

              {displayNarrative ? (
                <AiPolishedField
                  active={isCurrentPositionAi}
                  className={cn(
                    "max-w-[42rem]",
                    (recordSufficiencyParagraphs.length > 0 || showLede) &&
                      "border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-4",
                    PROSE_RESET,
                  )}
                >
                  <p
                    className={cn(
                      "whitespace-pre-line text-[0.875rem] leading-[1.7]",
                      isCurrentPositionAi ? "text-[--metis-text-primary]" : "text-[--metis-text-secondary]",
                    )}
                  >
                    {displayNarrative}
                  </p>
                  {displayWhyItMatters ? (
                    <div className="mt-4 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-3">
                      <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                        Why it matters
                      </p>
                      <p className="mt-1.5 text-[0.8125rem] leading-[1.55] text-[--metis-text-secondary]">{displayWhyItMatters}</p>
                    </div>
                  ) : null}
                </AiPolishedField>
              ) : !recordSufficiencyParagraphs.length && !showLede ? (
                <p className="text-[0.8125rem] text-[--metis-text-tertiary]">No executive summary recorded.</p>
              ) : null}

            </ExecutiveBriefSection>

            <ExecutiveBriefSection variant="neutral" accent="none" eyebrow="Action" title="Decisions needed">
              {model.decisions.length ? (
                <ol className="space-y-3">
                  {model.decisions.map((decision, index) => (
                    <li
                      key={`${index}-${decision.text.slice(0, 40)}`}
                      className="flex min-w-0 gap-3 border-b border-[color-mix(in_oklab,var(--metis-outline-subtle)_65%,transparent)] pb-3 last:border-0 last:pb-0"
                    >
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--metis-brass)_28%,var(--metis-outline-subtle))] text-[0.68rem] font-semibold tabular-nums text-[--metis-brass-soft]"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.875rem] font-medium leading-[1.5] text-[--metis-text-primary]">{decision.text}</p>
                        <p className="mt-1.5 text-[0.7rem] text-[--metis-text-tertiary]">
                          Owner — {ownerForDecision(decision.owner)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-tertiary]">No decisions listed in this revision.</p>
              )}
            </ExecutiveBriefSection>
          </div>

          {model.whatChanged.length ? (
            <ExecutiveBriefSection variant="muted" compact noBorder eyebrow="Since last revision" title="What changed">
              <RecordList items={model.whatChanged} emptyLabel="No recorded changes." />
            </ExecutiveBriefSection>
          ) : null}

          <ExecutiveBriefSection
            variant="neutral"
            accent="none"
            eyebrow="Circulation"
            title="Comms guardrails"
            description="What may be said now versus what must stay off the record."
          >
            <div className="grid gap-4 md:grid-cols-2 md:gap-5">
              <ExecutiveBriefSection variant="neutral" accent="brass" compact title="Safe to say">
                <RecordList
                  items={safeShown}
                  emptyLabel="Use confirmed facts and sources before circulating externally."
                  remainder={safeRemainder}
                />
              </ExecutiveBriefSection>
              <ExecutiveBriefSection variant="neutral" accent="amber" compact title="Do not say yet">
                <RecordList
                  items={holdShown}
                  emptyLabel="No explicit hold lines — apply standard validation discipline."
                  remainder={holdRemainder}
                />
              </ExecutiveBriefSection>
            </div>
          </ExecutiveBriefSection>

          <ExecutiveBriefSection
            variant="neutral"
            accent="none"
            eyebrow="Record basis"
            title="What the record says"
            description="Confirmed facts, conditional claims, and unresolved questions — not circulation guidance."
          >
            {model.claimsPositionSummary ? (
              <p className="mb-4 max-w-prose text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
                {model.claimsPositionSummary}
              </p>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:gap-5">
              <RecordPanel
                title="Confirmed"
                chip={<StatusChip tone="neutral">Confirmed</StatusChip>}
                accent="brass"
                description="Settled for internal briefing."
                items={confirmedCombined}
                emptyLabel="No confirmed facts on file yet."
              />

              <div className="flex min-w-0 flex-col gap-4">
                <RecordPanel
                  title="Assumptions / needs validation"
                  chip={<StatusChip tone="amber">Needs care</StatusChip>}
                  accent="amber"
                  description="Phrase conditionally — not verified fact."
                  items={cautionCombined}
                  emptyLabel="No assumptions or validation items in the register."
                />
                <RecordPanel
                  title="Still open"
                  chip={<StatusChip tone="outline">Open</StatusChip>}
                  accent="slate"
                  description="Unresolved until answered."
                  items={openQuestionsAsItems}
                  emptyLabel="No open questions recorded."
                />
              </div>
            </div>
          </ExecutiveBriefSection>

          {model.audienceImplications ? (
            <ExecutiveBriefSection variant="muted" compact noBorder title="Audience implications">
              <p className="max-w-prose whitespace-pre-line text-[0.8125rem] leading-[1.55] text-[--metis-text-secondary]">
                {model.audienceImplications}
              </p>
            </ExecutiveBriefSection>
          ) : null}

          <footer className="border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] pt-4">
            <div className="flex gap-2.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[--metis-text-tertiary]" aria-hidden />
              <div className="min-w-0 space-y-1.5">
                <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Provenance</p>
                <p className="text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">
                  Generated from the issue record
                  {model.provenance.sourcesCount != null ? ` · ${model.provenance.sourcesCount} linked source(s)` : ""}
                  {model.provenance.openQuestionsCount != null
                    ? ` · ${model.provenance.openQuestionsCount} open question(s)`
                    : ""}
                  {model.provenance.observationsIncluded != null
                    ? ` · ${model.provenance.observationsIncluded} observation(s) in brief`
                    : ""}
                  {model.provenance.observationsExcluded != null
                    ? ` · ${model.provenance.observationsExcluded} excluded`
                    : ""}
                  .
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href={`/issues/${issueId}/sources`}
                    className="text-[0.72rem] text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Sources
                  </Link>
                  <Link
                    href={`/issues/${issueId}/claims`}
                    className="text-[0.72rem] text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Claims
                  </Link>
                  <Link
                    href={`/issues/${issueId}/gaps`}
                    className="text-[0.72rem] text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Open questions
                  </Link>
                  <Link
                    href={`/issues/${issueId}/compare?mode=executive`}
                    className="text-[0.72rem] text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Brief delta
                  </Link>
                </div>
              </div>
            </div>
          </footer>

          <CollapsibleSection
            defaultOpen={false}
            className="border-0 border-t border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] bg-transparent px-0 shadow-none"
            summaryClassName="text-[--metis-text-tertiary]"
            summary={
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em]">View generated text (audit)</span>
            }
          >
            <div className="space-y-3 pt-2">
              {model.rawBlocks.map((block) => (
                <div
                  key={block.label}
                  className="rounded-md border border-[color-mix(in_oklab,var(--metis-outline-subtle)_75%,transparent)] px-3 py-2.5"
                >
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[--metis-text-tertiary]">{block.label}</p>
                  <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap font-sans text-[0.75rem] leading-relaxed text-[--metis-text-secondary]">
                    {block.body}
                  </pre>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </article>
    </div>
  );
}
