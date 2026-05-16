import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";

import { BriefExecutiveSummaryCompare } from "@/app/issues/[issueId]/brief/brief-executive-summary-compare";
import { ExecutiveBriefSection } from "@/components/brief/ExecutiveBriefSection";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import type {
  ExecutiveBriefLineItem,
  ExecutiveBriefPresentationModel,
} from "@/lib/brief/parseExecutiveBriefPresentation";
import { parseExecutiveLineItem } from "@/lib/brief/parseExecutiveBriefPresentation";
import { cn } from "@/lib/utils";

const PROSE_RESET =
  "[&_p]:m-0 [&_p]:text-[0.875rem] [&_p]:leading-[1.65] [&_p]:text-[--metis-text-secondary] [&_a]:text-[--metis-text-secondary] [&_a]:no-underline [&_a:hover]:text-[--metis-brass-soft] [&_strong]:font-medium [&_strong]:text-[--metis-text-primary]";

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

function MetaPill({ label, value, highlight }: { label: string; value: string; highlight?: "warning" | "neutral" }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border px-2.5 py-1.5",
        highlight === "warning"
          ? "border-[color-mix(in_oklab,var(--metis-status-warning-fg)_22%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_45%,transparent)]"
          : "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_55%,transparent)]",
      )}
    >
      <p className="text-[0.52rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">{label}</p>
      <p className="mt-0.5 truncate text-[0.78rem] font-medium leading-snug text-[--metis-text-primary]">{value}</p>
    </div>
  );
}

function RecordCodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] px-1.5 py-0.5 font-mono text-[0.62rem] font-medium tracking-wide text-[--metis-text-tertiary]">
      {code}
    </span>
  );
}

function RecordLine({ item }: { item: ExecutiveBriefLineItem | string }) {
  const parsed = typeof item === "string" ? parseExecutiveLineItem(item) : item;
  return (
    <li className="flex min-w-0 gap-2.5 py-1.5">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color-mix(in_oklab,var(--metis-brass)_55%,var(--metis-outline-strong))]" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        {parsed.code ? <RecordCodeChip code={parsed.code} /> : null}
        <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{parsed.text}</p>
      </div>
    </li>
  );
}

function ScanList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-tertiary]">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-[color-mix(in_oklab,var(--metis-outline-subtle)_65%,transparent)]">
      {items.map((item) => (
        <RecordLine key={item} item={item} />
      ))}
    </ul>
  );
}

function RecordLineItems({ items, emptyLabel }: { items: ExecutiveBriefLineItem[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-tertiary]">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-[color-mix(in_oklab,var(--metis-outline-subtle)_65%,transparent)]">
      {items.map((item) => (
        <RecordLine key={`${item.code ?? "x"}-${item.text}`} item={item} />
      ))}
    </ul>
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
}) {
  const ownerForDecision = (owner: string | null) => {
    if (owner && !/not recorded|not assigned/i.test(owner)) return owner;
    return "Owner not assigned";
  };

  const { whyItMatters } = splitExecutiveSummary(model.position.executiveSummary);

  const confirmedClaims = model.claimGroups.filter((g) => g.id === "confirmed").flatMap((g) => g.items);
  const assumptionItems = model.claimGroups.filter((g) => g.id === "assumptions").flatMap((g) => g.items);
  const needsValidationItems = model.claimGroups.filter((g) => g.id === "needsValidation").flatMap((g) => g.items);
  const cautionItems = [...assumptionItems, ...needsValidationItems];

  const statusHighlight = /caveat/i.test(model.header.status) ? "warning" : undefined;

  return (
    <div className="mx-auto w-full max-w-[52rem] min-w-0">
      <article
        className="overflow-hidden rounded-[1rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent),0_12px_40px_color-mix(in_oklab,var(--metis-frame)_35%,transparent)]"
      >
        {/* Header panel */}
        <header className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_72%,var(--metis-surface-card))] px-4 py-4 sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="min-w-0 space-y-1.5">
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Executive brief</p>
              <h2 className="max-w-prose text-lg font-semibold leading-snug tracking-tight text-[--metis-text-primary] sm:text-xl">
                {model.header.title}
              </h2>
              <p className="text-[0.8rem] leading-snug text-[--metis-text-secondary]">
                {model.header.status}
                <span className="text-[--metis-text-tertiary]"> · </span>
                {model.header.briefingPosture}
              </p>
            </div>
            <Badge
              className={cn(
                "shrink-0 border-0 text-[0.68rem] font-medium",
                statusHighlight === "warning"
                  ? "bg-[--metis-status-warning-bg] text-[--metis-status-warning-fg]"
                  : "bg-[color-mix(in_oklab,var(--metis-surface-elevated)_75%,transparent)] text-[--metis-text-secondary]",
              )}
            >
              {briefInSync ? "Up to date" : "Needs refresh"}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <MetaPill label="Status" value={model.header.status} highlight={statusHighlight} />
            <MetaPill label="Severity" value={model.header.severity} />
            <MetaPill label="Urgency" value={model.header.urgency} />
            <MetaPill label="Open questions" value={model.header.openGapsLabel} />
            <MetaPill label="Owner" value={model.header.owner} />
            <MetaPill label="Version" value={briefVersionLabel} />
          </div>

          <p className="mt-2 text-[0.68rem] text-[--metis-text-tertiary]">
            {briefGeneratedAt ? `Generated ${formatShortDate(briefGeneratedAt)}` : `Issue updated ${formatShortDate(issueUpdatedAt)}`}
            <span aria-hidden> · </span>
            {model.header.circulation}
          </p>
        </header>

        <div className="space-y-4 px-3 py-4 sm:space-y-5 sm:px-5 sm:py-5">
          {/* Top grid: position + decisions */}
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <ExecutiveBriefSection
              variant="emphasis"
              eyebrow="Read first"
              title="Current position"
              description="Leadership judgement and working line."
            >
              {model.position.lede ? (
                <p className="mb-3 max-w-prose border-l-2 border-[color-mix(in_oklab,var(--metis-brass)_45%,transparent)] pl-3 text-[0.9375rem] font-medium leading-relaxed text-[--metis-text-primary]">
                  {model.position.lede}
                </p>
              ) : null}

              {model.position.executiveSummary.trim() ? (
                <div className={cn("max-w-prose rounded-md bg-[color-mix(in_oklab,var(--metis-surface-elevated)_35%,transparent)] px-3 py-2.5", PROSE_RESET)}>
                  <BriefExecutiveSummaryCompare
                    deterministicBody={model.position.executiveSummary}
                    alternateWording={executiveExecAlternateWording}
                    briefAiSynthesisEnabled={briefAiSynthesisEnabled}
                    polishPreview={polishPreview}
                  />
                </div>
              ) : (
                <p className="text-[0.8125rem] text-[--metis-text-tertiary]">No executive summary recorded.</p>
              )}

              {whyItMatters ? (
                <div className="mt-3 rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-3 py-2.5">
                  <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Why it matters</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{whyItMatters}</p>
                </div>
              ) : null}
            </ExecutiveBriefSection>

            <ExecutiveBriefSection
              variant="default"
              eyebrow="Action"
              title="Decisions needed"
              description="What leadership should decide or assign next."
              className="lg:min-h-[12rem]"
            >
              {model.decisions.length ? (
                <ol className="space-y-2.5">
                  {model.decisions.map((decision, index) => (
                    <li
                      key={`${index}-${decision.text.slice(0, 40)}`}
                      className="flex min-w-0 gap-3 rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_40%,transparent)] px-3 py-2.5"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--metis-brass)_35%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_10%,transparent)] text-[0.68rem] font-semibold tabular-nums text-[--metis-brass-soft]"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.8125rem] font-medium leading-relaxed text-[--metis-text-primary]">{decision.text}</p>
                        <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[--metis-text-tertiary]">
                          Owner · {ownerForDecision(decision.owner)}
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
            <ExecutiveBriefSection variant="muted" compact eyebrow="Since last revision" title="What changed">
              <ScanList items={model.whatChanged} emptyLabel="No recorded changes." />
            </ExecutiveBriefSection>
          ) : null}

          {/* Situation grid */}
          <div>
            <p className="mb-2 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Situation on the record</p>
            <div className="grid gap-3 md:grid-cols-3">
              <ExecutiveBriefSection variant="confirmed" compact title="Confirmed" description="Settled for internal briefing.">
                <div className="mb-2 flex items-center gap-1.5 text-[--metis-status-success-fg]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em]">Facts & register</span>
                </div>
                <ScanList items={model.confirmedFacts} emptyLabel="No confirmed facts on file yet." />
                {confirmedClaims.length ? (
                  <div className="mt-2 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-2">
                    <RecordLineItems items={confirmedClaims} emptyLabel="" />
                  </div>
                ) : null}
              </ExecutiveBriefSection>

              <ExecutiveBriefSection
                variant="caution"
                compact
                title="Assumptions / needs validation"
                description="Not verified fact — phrase with care."
              >
                <RecordLineItems items={cautionItems} emptyLabel="No assumptions or validation items in the register." />
              </ExecutiveBriefSection>

              <ExecutiveBriefSection variant="open" compact title="Still open" description="Unresolved until answered.">
                <div className="mb-2 flex items-center gap-1.5 text-[--metis-status-info-fg]">
                  <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em]">Open questions</span>
                </div>
                <ScanList items={model.openQuestions} emptyLabel="No open questions recorded." />
              </ExecutiveBriefSection>
            </div>
          </div>

          {/* Guardrails band */}
          <div className="rounded-[0.85rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_50%,var(--metis-surface-card))] p-3 sm:p-4">
            <p className="mb-3 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Circulation guardrails</p>
            <div className="grid gap-3 md:grid-cols-2">
              <ExecutiveBriefSection variant="guard-safe" compact title="Safe to say">
                <div className="mb-2 flex items-center gap-1.5 text-[--metis-status-success-fg]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em]">Confirmed lines only</span>
                </div>
                <ScanList
                  items={model.safeToSay}
                  emptyLabel="Use confirmed facts and sources before circulating externally."
                />
              </ExecutiveBriefSection>

              <ExecutiveBriefSection variant="guard-hold" compact title="Do not say yet">
                <div className="mb-2 flex items-center gap-1.5 text-[--metis-status-warning-fg]">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.12em]">Hold lines</span>
                </div>
                <ScanList
                  items={model.doNotSayYet}
                  emptyLabel="No explicit hold lines — apply standard validation discipline."
                />
              </ExecutiveBriefSection>
            </div>
          </div>

          {model.audienceImplications ? (
            <ExecutiveBriefSection variant="muted" compact title="Audience implications">
              <p className="max-w-prose whitespace-pre-line text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
                {model.audienceImplications}
              </p>
            </ExecutiveBriefSection>
          ) : null}

          {/* Provenance footer */}
          <ExecutiveBriefSection variant="footer" compact title="Evidence & provenance">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[--metis-info]" aria-hidden />
              <div className="min-w-0 space-y-2">
                <p className="text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
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
                {model.evidenceSummary ? (
                  <p className="max-w-prose text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">{model.evidenceSummary}</p>
                ) : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                  <Link
                    href={`/issues/${issueId}/sources`}
                    className="text-[0.75rem] font-medium text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Sources
                  </Link>
                  <Link
                    href={`/issues/${issueId}/claims`}
                    className="text-[0.75rem] font-medium text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Claims
                  </Link>
                  <Link
                    href={`/issues/${issueId}/gaps`}
                    className="text-[0.75rem] font-medium text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Open questions
                  </Link>
                  <Link
                    href={`/issues/${issueId}/compare?mode=executive`}
                    className="text-[0.75rem] font-medium text-[--metis-text-secondary] underline-offset-2 hover:text-[--metis-brass-soft] hover:underline"
                  >
                    Brief delta
                  </Link>
                </div>
              </div>
            </div>
          </ExecutiveBriefSection>

          <CollapsibleSection
            defaultOpen={false}
            className="border-dashed bg-transparent shadow-none"
            summaryClassName="text-[--metis-text-tertiary]"
            summary={
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.16em]">View generated text (audit)</span>
            }
          >
            <div className="space-y-4">
              {model.rawBlocks.map((block) => (
                <div
                  key={block.label}
                  className="rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_30%,transparent)] px-3 py-2.5"
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
