import type { ReactNode } from "react";

import { ExecutiveBriefSection } from "@/components/brief/ExecutiveBriefSection";
import { Badge } from "@/components/ui/badge";
import type { DemoBriefRecord, DemoStage } from "@/lib/demo/towerBriefingDemo";
import { cn } from "@/lib/utils";

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

function sectionBody(brief: DemoBriefRecord, ...titles: string[]): string[] {
  const found = brief.sections.filter((s) => titles.some((t) => s.title.toLowerCase().includes(t.toLowerCase())));
  return found.flatMap((s) => s.body);
}

function RecordList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-[0.8125rem] text-[--metis-text-tertiary]">None recorded at this stage.</p>;
  return (
    <ul className="space-y-0">
      {items.map((line) => (
        <li key={line} className="flex min-w-0 gap-2.5 py-2 first:pt-0">
          <span
            className="mt-[0.45rem] h-px w-3 shrink-0 bg-[color-mix(in_oklab,var(--metis-outline-strong)_55%,transparent)]"
            aria-hidden
          />
          <p className="text-[0.8125rem] leading-[1.55] text-[--metis-text-secondary]">{line}</p>
        </li>
      ))}
    </ul>
  );
}

export function DemoExecutiveBrief({ brief, stage }: { brief: DemoBriefRecord; stage: DemoStage }) {
  const executiveSummary = sectionBody(brief, "Executive summary");
  const decisions = sectionBody(brief, "decisions", "Recommended");
  const confirmed = sectionBody(brief, "Confirmed facts");
  const claims = sectionBody(brief, "Claims");
  const openQuestions = sectionBody(brief, "Open questions");
  const guardrails = sectionBody(brief, "guardrail", "What not to say");
  const safeToSay = stage.cockpit.safeToSay ? [stage.cockpit.safeToSay] : [];
  const doNotSay = guardrails.length ? guardrails : [stage.cockpit.doNotSayYet];

  return (
    <article className="mx-auto w-full min-w-0 max-w-[72rem] overflow-hidden rounded-[0.85rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] shadow-[0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_15%,transparent)]">
      <header className="border-b border-[--metis-outline-subtle] px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.2em] text-[--metis-brass-soft]">Executive brief</p>
            <h2 className="text-lg font-semibold leading-snug tracking-tight text-[--metis-text-primary] sm:text-[1.25rem]">
              {brief.title}
            </h2>
          </div>
          <Badge className="shrink-0 border border-[--metis-outline-subtle] bg-transparent text-[0.68rem] font-medium text-[--metis-text-secondary]">
            Read-only · {brief.code}
          </Badge>
        </div>
        <p className="mt-2 max-w-prose text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{brief.statusLine}</p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <MetaChip label="Severity" value={brief.severity} />
          <MetaChip label="Urgency" value={brief.urgency} />
          <MetaChip label="Posture" value={brief.briefingPosture} />
          <MetaChip label="Stage time" value={stage.timestampLabel} />
        </div>
        <p className="mt-3 text-[0.68rem] text-[--metis-text-tertiary]">
          {brief.ownerName} · {brief.ownerRole} · {brief.timestampLabel}
        </p>
      </header>

      <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-7 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-6">
          <ExecutiveBriefSection variant="emphasis" accent="brass" eyebrow="Read first" title="Current position">
            <p className="mb-4 max-w-[42rem] text-[0.9375rem] font-medium leading-[1.6] text-[--metis-text-primary]">{brief.lede}</p>
            {executiveSummary.length ? (
              <div className="max-w-[42rem] space-y-2 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-4">
                {executiveSummary.map((p) => (
                  <p key={p} className="text-[0.875rem] leading-[1.7] text-[--metis-text-secondary]">
                    {p}
                  </p>
                ))}
              </div>
            ) : null}
          </ExecutiveBriefSection>

          <ExecutiveBriefSection variant="neutral" accent="none" eyebrow="Action" title="Decisions needed">
            {decisions.length ? (
              <ol className="space-y-3">
                {decisions.map((line, index) => (
                  <li
                    key={line}
                    className="flex min-w-0 gap-3 border-b border-[color-mix(in_oklab,var(--metis-outline-subtle)_65%,transparent)] pb-3 last:border-0 last:pb-0"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--metis-brass)_28%,var(--metis-outline-subtle))] text-[0.68rem] font-semibold tabular-nums text-[--metis-brass-soft]"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <p className="text-[0.875rem] font-medium leading-[1.5] text-[--metis-text-primary]">{line}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[0.8125rem] text-[--metis-text-tertiary]">No decisions listed for this stage.</p>
            )}
          </ExecutiveBriefSection>
        </div>

        <ExecutiveBriefSection
          variant="neutral"
          accent="none"
          eyebrow="Record basis"
          title="What the record says"
          description="Confirmed facts, conditional claims, and unresolved questions at this point in time."
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:gap-5">
            <ExecutiveBriefSection variant="neutral" accent="brass" compact title="Confirmed">
              <div className="mb-2.5">
                <StatusChip tone="neutral">Confirmed</StatusChip>
              </div>
              <RecordList items={confirmed} />
            </ExecutiveBriefSection>
            <div className="flex min-w-0 flex-col gap-4">
              <ExecutiveBriefSection variant="neutral" accent="amber" compact title="Claims register">
                <div className="mb-2.5">
                  <StatusChip tone="amber">Needs care</StatusChip>
                </div>
                <RecordList items={claims} />
              </ExecutiveBriefSection>
              <ExecutiveBriefSection variant="neutral" accent="slate" compact title="Still open">
                <div className="mb-2.5">
                  <StatusChip tone="outline">Open</StatusChip>
                </div>
                <RecordList items={openQuestions} />
              </ExecutiveBriefSection>
            </div>
          </div>
        </ExecutiveBriefSection>

        <ExecutiveBriefSection variant="neutral" accent="none" eyebrow="Circulation" title="Comms guardrails">
          <div className="grid gap-4 md:grid-cols-2 md:gap-5">
            <ExecutiveBriefSection variant="neutral" accent="brass" compact title="Safe to say">
              <RecordList items={safeToSay} />
            </ExecutiveBriefSection>
            <ExecutiveBriefSection variant="neutral" accent="amber" compact title="Do not say yet">
              <RecordList items={doNotSay} />
            </ExecutiveBriefSection>
          </div>
        </ExecutiveBriefSection>

        <footer className="border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_80%,transparent)] pt-4">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Provenance</p>
          <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">
            Demo executive brief {brief.code} for stage {stage.index}. Linked records: {brief.linkedRecordCodes.join(", ")}.
            Stored brief remains the source of truth in a live Metis workspace.
          </p>
        </footer>
      </div>
    </article>
  );
}
