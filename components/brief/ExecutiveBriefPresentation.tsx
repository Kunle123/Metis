import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";

import { BriefExecutiveSummaryCompare } from "@/app/issues/[issueId]/brief/brief-executive-summary-compare";
import { ExecutiveBriefSection } from "@/components/brief/ExecutiveBriefSection";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import type { NormalizedAlternateWording } from "@/lib/brief/alternateWording";
import type { ExecutiveBriefPresentationModel } from "@/lib/brief/parseExecutiveBriefPresentation";
import { cn } from "@/lib/utils";

function formatShortDate(d: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function BulletList({
  items,
  emptyLabel,
  className,
}: {
  items: string[];
  emptyLabel: string;
  className?: string;
}) {
  if (!items.length) {
    return <p className="text-sm leading-relaxed text-[--metis-text-tertiary]">{emptyLabel}</p>;
  }
  return (
    <ul className={cn("space-y-2.5 text-sm leading-relaxed text-[--metis-text-secondary]", className)}>
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[--metis-outline-strong]" aria-hidden />
          <span className="whitespace-pre-line">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">{label}</p>
      <p className="mt-0.5 text-[0.8rem] font-medium leading-snug text-[--metis-text-primary]">{value}</p>
    </div>
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

  const statusTone = /caveat/i.test(model.header.status)
    ? "bg-[--metis-status-warning-bg] text-[--metis-status-warning-fg]"
    : "bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]";

  return (
    <div className="space-y-5">
      <header className="rounded-[1.05rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_55%,var(--metis-surface-card))] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Executive brief</p>
            <h2 className="font-[Cormorant_Garamond] text-[1.65rem] leading-tight text-[--metis-text-primary] sm:text-[1.85rem]">
              {model.header.title}
            </h2>
          </div>
          <Badge className={cn("shrink-0 border-0", statusTone)}>{model.header.status}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetaChip label="Severity" value={model.header.severity} />
          <MetaChip label="Urgency" value={model.header.urgency} />
          <MetaChip label="Owner" value={model.header.owner} />
          <MetaChip label="Brief version" value={briefVersionLabel} />
          <MetaChip
            label="Freshness"
            value={briefInSync ? "Up to date" : "Needs refresh"}
          />
          <MetaChip label="Circulation" value={model.header.circulation} />
          <MetaChip label="Open questions" value={model.header.openGapsLabel} />
          {briefGeneratedAt ? (
            <MetaChip label="Brief generated" value={formatShortDate(briefGeneratedAt)} />
          ) : (
            <MetaChip label="Issue updated" value={formatShortDate(issueUpdatedAt)} />
          )}
        </div>
      </header>

      <ExecutiveBriefSection
        eyebrow="Executive position"
        title="Current position"
        description="Leadership judgement and working line — read this first."
        tone="emphasis"
      >
        {model.position.lede ? (
          <p className="mb-4 max-w-4xl font-[Cormorant_Garamond] text-[1.25rem] leading-snug text-[--metis-text-primary] sm:text-[1.4rem]">
            {model.position.lede}
          </p>
        ) : null}
        {model.position.executiveSummary.trim() ? (
          <div className="max-w-4xl text-sm leading-7 text-[--metis-text-secondary]">
            <BriefExecutiveSummaryCompare
              deterministicBody={model.position.executiveSummary}
              alternateWording={executiveExecAlternateWording}
              briefAiSynthesisEnabled={briefAiSynthesisEnabled}
              polishPreview={polishPreview}
            />
          </div>
        ) : null}
        {model.position.assessmentLines.length ? (
          <ul className="mt-4 space-y-1 border-t border-[--metis-outline-subtle] pt-3 text-[0.78rem] leading-relaxed text-[--metis-text-tertiary]">
            {model.position.assessmentLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </ExecutiveBriefSection>

      {model.decisions.length ? (
        <ExecutiveBriefSection
          eyebrow="Decisions"
          title="Decisions required"
          description="Named actions leadership should expect — not buried in narrative."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {model.decisions.map((decision, index) => (
              <article
                key={`${index}-${decision.text.slice(0, 48)}`}
                className="rounded-lg border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_40%,transparent)] px-3.5 py-3.5"
              >
                <p className="text-sm font-medium leading-relaxed text-[--metis-text-primary]">{decision.text}</p>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                  Owner · {ownerForDecision(decision.owner)}
                </p>
              </article>
            ))}
          </div>
        </ExecutiveBriefSection>
      ) : null}

      {model.whatChanged.length ? (
        <ExecutiveBriefSection
          eyebrow="Since last revision"
          title="What changed"
          description="Recorded briefing-input changes — not inferred narrative."
        >
          <BulletList items={model.whatChanged} emptyLabel="No recorded changes." />
        </ExecutiveBriefSection>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <ExecutiveBriefSection
          eyebrow="Evidence posture"
          title="Confirmed facts"
          description="Client-confirmed or register-confirmed — safe to treat as settled for internal briefing."
        >
          <div className="mb-2 flex items-center gap-2 text-[--metis-status-success-fg]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em]">Confirmed</span>
          </div>
          <BulletList items={model.confirmedFacts} emptyLabel="No confirmed facts are recorded yet." />
        </ExecutiveBriefSection>

        <ExecutiveBriefSection
          eyebrow="Unresolved"
          title="Open questions"
          description="Explicitly unresolved — do not read as settled."
          tone="caution"
        >
          <div className="mb-2 flex items-center gap-2 text-[--metis-status-warning-fg]">
            <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.14em]">Not yet answered</span>
          </div>
          <BulletList items={model.openQuestions} emptyLabel="No open questions are recorded yet." />
        </ExecutiveBriefSection>
      </div>

      {model.claimGroups.length ? (
        <div className="space-y-4">
          {model.claimGroups.map((group) => (
            <ExecutiveBriefSection
              key={group.id}
              eyebrow="Claims register"
              title={group.title}
              description={group.caveat}
              tone={group.id === "confirmed" ? "default" : "caution"}
            >
              {group.id === "assumptions" ? (
                <p className="mb-3 rounded-md border border-[color-mix(in_oklab,var(--metis-status-warning-fg)_25%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_40%,transparent)] px-3 py-2 text-[0.75rem] leading-relaxed text-[--metis-status-warning-fg]">
                  Working assumptions — phrase conditionally; not verified fact.
                </p>
              ) : null}
              {group.id === "needsValidation" ? (
                <p className="mb-3 rounded-md border border-[color-mix(in_oklab,var(--metis-status-danger-fg)_22%,transparent)] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_35%,transparent)] px-3 py-2 text-[0.75rem] leading-relaxed text-[--metis-status-danger-fg]">
                  Needs validation — do not state as settled fact.
                </p>
              ) : null}
              <BulletList items={group.items} emptyLabel="None in this group." />
            </ExecutiveBriefSection>
          ))}
        </div>
      ) : null}

      <ExecutiveBriefSection
        eyebrow="Circulation guardrails"
        title="Safe to say · Do not say yet"
        description="Internal briefing lines — calm, evidence-tied, no dramatic language."
        tone="guard"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[color-mix(in_oklab,var(--metis-status-success-fg)_20%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_25%,transparent)] px-3.5 py-3.5">
            <div className="mb-2 flex items-center gap-2 text-[--metis-status-success-fg]">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              <h4 className="text-[0.68rem] font-medium uppercase tracking-[0.14em]">Safe to say</h4>
            </div>
            <BulletList
              items={model.safeToSay}
              emptyLabel="No safe lines are listed yet — rely on confirmed facts and sources before circulating."
            />
          </div>
          <div className="rounded-lg border border-[color-mix(in_oklab,var(--metis-status-danger-fg)_18%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_22%,transparent)] px-3.5 py-3.5">
            <div className="mb-2 flex items-center gap-2 text-[--metis-status-danger-fg]">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
              <h4 className="text-[0.68rem] font-medium uppercase tracking-[0.14em]">Do not say yet</h4>
            </div>
            <BulletList
              items={model.doNotSayYet}
              emptyLabel="No explicit hold lines — still apply standard evidence and validation discipline."
            />
          </div>
        </div>
      </ExecutiveBriefSection>

      {model.audienceImplications ? (
        <ExecutiveBriefSection eyebrow="Audience" title="Audience implications" tone="default">
          <p className="max-w-4xl whitespace-pre-line text-sm leading-7 text-[--metis-text-secondary]">{model.audienceImplications}</p>
        </ExecutiveBriefSection>
      ) : null}

      <footer className="rounded-[1.05rem] border border-dashed border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[--metis-info]" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-[--metis-text-tertiary]">Evidence & provenance</p>
            <p className="text-sm leading-relaxed text-[--metis-text-secondary]">
              Brief generated from the issue record
              {model.provenance.sourcesCount != null ? ` · ${model.provenance.sourcesCount} linked source(s)` : ""}
              {model.provenance.openQuestionsCount != null ? ` · ${model.provenance.openQuestionsCount} open question(s) on record` : ""}
              {model.provenance.observationsIncluded != null
                ? ` · ${model.provenance.observationsIncluded} observation(s) included`
                : ""}
              {model.provenance.observationsExcluded != null
                ? ` · ${model.provenance.observationsExcluded} observation(s) excluded from brief`
                : ""}
              .
            </p>
            {model.evidenceSummary ? (
              <p className="max-w-4xl text-[0.78rem] leading-relaxed text-[--metis-text-tertiary]">{model.evidenceSummary}</p>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-1 text-[0.78rem]">
              <Link href={`/issues/${issueId}/sources`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
                Sources
              </Link>
              <Link href={`/issues/${issueId}/claims`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
                Claims
              </Link>
              <Link href={`/issues/${issueId}/gaps`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
                Open questions
              </Link>
              <Link href={`/issues/${issueId}/compare?mode=executive`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
                Brief delta
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <CollapsibleSection
        defaultOpen={false}
        summary={
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">View generated text</span>
        }
      >
        <div className="space-y-5">
          {model.rawBlocks.map((block) => (
            <div key={block.label} className="border-t border-[--metis-outline-subtle] pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm font-semibold text-[--metis-text-primary]">{block.label}</p>
              <pre className="mt-2 max-w-full overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-7 text-[--metis-text-secondary]">
                {block.body}
              </pre>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
