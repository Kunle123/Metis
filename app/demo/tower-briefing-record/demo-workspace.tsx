"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { DemoExecutiveBrief } from "@/components/demo/DemoExecutiveBrief";
import { DemoMessageCard } from "@/components/demo/DemoMessageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  demoTabs,
  getTowerDemoStageData,
  recordStateAtStage,
  towerBriefingDemo,
  type DemoSituationRecord,
  type DemoStage,
  type DemoStageId,
  type DemoTabId,
} from "@/lib/demo/towerBriefingDemo";
import { cn } from "@/lib/utils";

const DEFAULT_STAGE: DemoStageId = "stage-1";
const DEFAULT_TAB: DemoTabId = "situation";

function RecordCodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded border border-[color-mix(in_oklab,var(--metis-outline-subtle)_90%,transparent)] bg-[color-mix(in_oklab,var(--metis-paper)_40%,transparent)] px-1.5 py-0.5 font-mono text-[0.6rem] font-medium tracking-wide text-[--metis-text-tertiary]">
      {code}
    </span>
  );
}

function StateChip({ state }: { state: string }) {
  const tone =
    state === "Superseded"
      ? "text-[--metis-text-tertiary]"
      : state === "Still open" || state === "Needs validation"
        ? "text-[--metis-status-warning-fg]"
        : state === "Confirmed"
          ? "text-[--metis-text-secondary]"
          : "text-[--metis-text-secondary]";
  return (
    <span className={cn("rounded border border-[--metis-outline-subtle] px-1.5 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.08em]", tone)}>
      {state}
    </span>
  );
}

function recordKind(record: DemoSituationRecord): string {
  if (record.recordType === "source") return "Source";
  if (record.recordType === "observation") return "Observation";
  if (record.recordType === "claim") return "Claim";
  return "Open question";
}

function CtaLink({ className }: { className?: string }) {
  return (
    <Button asChild className={cn("rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]", className)}>
      <a href={towerBriefingDemo.walkthroughHref}>Request a private walkthrough</a>
    </Button>
  );
}

function DemoHeader() {
  return (
    <header className="space-y-4 border-b border-[--metis-outline-subtle] pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
          Metis
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_50%,transparent)] text-[0.68rem] text-[--metis-text-secondary]">
            Read-only demo
          </Badge>
          <CtaLink />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-start">
        <div className="min-w-0 space-y-2">
          <p className="text-[0.8125rem] font-medium text-[--metis-brass-soft]">{towerBriefingDemo.coreLine}</p>
          <h1 className="font-[Cormorant_Garamond] text-[2.25rem] leading-tight text-[--metis-text-primary] sm:text-[2.75rem]">
            {towerBriefingDemo.title}
          </h1>
          <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-[--metis-text-secondary]">{towerBriefingDemo.subtitle}</p>
        </div>
        <p className="rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_90%,var(--metis-paper))] px-4 py-3 text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">
          {towerBriefingDemo.disclaimer}
        </p>
      </div>
    </header>
  );
}

function StageSwitcher({
  selectedStageId,
  onChange,
}: {
  selectedStageId: DemoStageId;
  onChange: (id: DemoStageId) => void;
}) {
  return (
    <nav aria-label="Timeline stages" className="space-y-2">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Stage</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {towerBriefingDemo.stages.map((stage) => {
          const selected = stage.id === selectedStageId;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onChange(stage.id)}
              className={cn(
                "min-w-0 rounded-md border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--metis-brass)_40%,transparent)]",
                selected
                  ? "border-[color-mix(in_oklab,var(--metis-brass)_35%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_8%,var(--metis-surface-card))]"
                  : "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_96%,var(--metis-paper))] hover:border-[color-mix(in_oklab,var(--metis-outline-strong)_50%,transparent)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.62rem] font-medium tabular-nums text-[--metis-text-tertiary]">Stage {stage.index}</span>
                <span className="text-[0.62rem] text-[--metis-text-tertiary]">{stage.timestampLabel}</span>
              </div>
              <p className="mt-1.5 text-[0.8125rem] font-medium leading-snug text-[--metis-text-primary]">{stage.shortLabel}</p>
              <p className="mt-1 line-clamp-2 text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">{stage.summary}</p>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Cockpit({ stage }: { stage: DemoStage }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Current position", value: stage.cockpit.currentPosition },
    { label: "What changed", value: stage.cockpit.whatChanged },
    { label: "Needs decision", value: stage.cockpit.needsDecision },
    { label: "Safe to say", value: stage.cockpit.safeToSay },
    { label: "Do not say yet", value: stage.cockpit.doNotSayYet },
  ];

  return (
    <section
      aria-label="Comms manager cockpit"
      className="rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]"
    >
      <div className="border-b border-[--metis-outline-subtle] px-4 py-3 sm:px-5">
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Comms manager cockpit</p>
        <p className="mt-0.5 text-[0.875rem] font-medium text-[--metis-text-primary]">{stage.title}</p>
      </div>
      <div className="grid gap-px bg-[color-mix(in_oklab,var(--metis-outline-subtle)_60%,transparent)] sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] px-4 py-3">
            <p className="text-[0.52rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">{row.label}</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ViewTabs({ selected, onChange }: { selected: DemoTabId; onChange: (t: DemoTabId) => void }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-[--metis-outline-subtle] pb-3">
      {demoTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-[0.8125rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--metis-brass)_40%,transparent)]",
            selected === tab.id
              ? "border-[color-mix(in_oklab,var(--metis-brass)_30%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-brass)_8%,transparent)] text-[--metis-text-primary]"
              : "border-[--metis-outline-subtle] text-[--metis-text-secondary] hover:text-[--metis-text-primary]",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function RecordCard({ record, stageId }: { record: DemoSituationRecord; stageId: DemoStageId }) {
  const state = recordStateAtStage(record, stageId);
  return (
    <article className="rounded-md border border-[--metis-outline-subtle] border-l-[3px] border-l-[color-mix(in_oklab,var(--metis-brass)_40%,transparent)] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <RecordCodeChip code={record.code} />
        <StateChip state={state} />
        <span className="text-[0.58rem] uppercase tracking-[0.1em] text-[--metis-text-tertiary]">{recordKind(record)}</span>
      </div>
      <h3 className="mt-2 text-[0.875rem] font-medium leading-snug text-[--metis-text-primary]">{record.title}</h3>
      <p className="mt-1 text-[0.72rem] text-[--metis-text-tertiary]">
        {record.ownerName} · {record.ownerRole} · {record.department} · {record.timestampLabel}
      </p>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">{record.body}</p>
      {record.recordType === "source" && record.detail.length ? (
        <ul className="mt-2 space-y-1 border-t border-[color-mix(in_oklab,var(--metis-outline-subtle)_70%,transparent)] pt-2">
          {record.detail.map((d) => (
            <li key={d} className="text-[0.75rem] leading-relaxed text-[--metis-text-tertiary]">
              {d}
            </li>
          ))}
        </ul>
      ) : null}
      {record.linkedRecordCodes.length ? (
        <p className="mt-2 text-[0.68rem] text-[--metis-text-tertiary]">Linked: {record.linkedRecordCodes.join(" · ")}</p>
      ) : null}
    </article>
  );
}

function SituationGroup({
  title,
  description,
  records,
  stageId,
}: {
  title: string;
  description: string;
  records: DemoSituationRecord[];
  stageId: DemoStageId;
}) {
  if (!records.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.11em] text-[--metis-text-primary]">{title}</h3>
        <p className="mt-1 text-[0.8125rem] text-[--metis-text-tertiary]">{description}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {records.map((r) => (
          <RecordCard key={r.id} record={r} stageId={stageId} />
        ))}
      </div>
    </section>
  );
}

function SituationView({ stage, records }: { stage: DemoStage; records: DemoSituationRecord[] }) {
  const groups = useMemo(() => {
    const withState = records.map((r) => ({ record: r, state: recordStateAtStage(r, stage.id) }));
    return {
      new: withState.filter((x) => x.state === "New").map((x) => x.record),
      carried: withState.filter((x) => x.state === "Carried forward" || x.state === "Confirmed").map((x) => x.record),
      superseded: withState.filter((x) => x.state === "Superseded").map((x) => x.record),
      open: withState.filter((x) => x.state === "Still open" || x.state === "Needs validation").map((x) => x.record),
    };
  }, [records, stage.id]);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
        Evidence on the issue record at this moment — sources, observations, claims and open questions, grouped for a comms
        manager scan.
      </p>
      <SituationGroup title="New in this stage" description="Introduced in this stage only." records={groups.new} stageId={stage.id} />
      <SituationGroup title="Carried forward" description="Still relevant from earlier stages." records={groups.carried} stageId={stage.id} />
      <SituationGroup title="Superseded" description="Retained for audit; not for current circulation." records={groups.superseded} stageId={stage.id} />
      <SituationGroup title="Still open" description="Unresolved questions and conditional claims." records={groups.open} stageId={stage.id} />
    </div>
  );
}

function MessagesView({
  messages,
  findings,
}: {
  messages: ReturnType<typeof getTowerDemoStageData>["visibleMessages"];
  findings: ReturnType<typeof getTowerDemoStageData>["visibleReviews"];
}) {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
        Governed message drafts for this stage — approval status, purpose, and record basis. Actions are disabled in this
        public demo.
      </p>
      <div className="space-y-5">
        {messages.map((m) => (
          <DemoMessageCard key={m.id} message={m} />
        ))}
      </div>
      {findings.length ? (
        <section className="rounded-md border border-dashed border-[color-mix(in_oklab,var(--metis-outline-subtle)_75%,transparent)] px-4 py-4">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">Claim alignment notes</p>
          <ul className="mt-3 space-y-3">
            {findings.map((f) => (
              <li key={f.id} className="text-[0.8125rem] leading-relaxed text-[--metis-text-secondary]">
                <span className="font-mono text-[0.68rem] text-[--metis-text-tertiary]">{f.code}</span> — {f.title}: {f.body}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BottomCta() {
  return (
    <section className="mt-8 rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_96%,var(--metis-paper))] px-5 py-6 sm:px-7">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[--metis-brass-soft]">Private walkthrough</p>
      <h2 className="mt-2 font-[Cormorant_Garamond] text-2xl leading-tight text-[--metis-text-primary] sm:text-[1.75rem]">
        Bring a recent issue and see how Metis would structure it.
      </h2>
      <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-[--metis-text-secondary]">
        Use a real-but-redacted issue to see how Metis separates what changed, what is known, what remains open, and what can
        safely be said.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <CtaLink />
        <Button disabled variant="outline" className="rounded-full text-[--metis-text-tertiary]">
          <LockKeyhole className="mr-2 h-4 w-4" aria-hidden />
          Generate brief (demo)
        </Button>
      </div>
    </section>
  );
}

export function TowerBriefingDemoWorkspace() {
  const [selectedStageId, setSelectedStageId] = useState<DemoStageId>(DEFAULT_STAGE);
  const [selectedTab, setSelectedTab] = useState<DemoTabId>(DEFAULT_TAB);

  const stageData = useMemo(() => getTowerDemoStageData(selectedStageId), [selectedStageId]);

  return (
    <main className="min-h-screen bg-[--metis-surface-page] text-[--metis-text-primary]">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
        <DemoHeader />
        <div className="mt-6 space-y-5">
          <StageSwitcher
            selectedStageId={selectedStageId}
            onChange={(id) => {
              setSelectedStageId(id);
              setSelectedTab(DEFAULT_TAB);
            }}
          />
          <Cockpit stage={stageData.stage} />
          <div className="min-w-0 rounded-md border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_98%,var(--metis-paper))] px-4 py-5 sm:px-6">
            <ViewTabs selected={selectedTab} onChange={setSelectedTab} />
            <div className="mt-5 min-w-0">
              {selectedTab === "situation" ? <SituationView stage={stageData.stage} records={stageData.situationRecords} /> : null}
              {selectedTab === "brief" && stageData.currentBrief ? (
                <DemoExecutiveBrief brief={stageData.currentBrief} stage={stageData.stage} />
              ) : null}
              {selectedTab === "brief" && !stageData.currentBrief ? (
                <p className="text-[0.8125rem] text-[--metis-text-tertiary]">No brief at this stage.</p>
              ) : null}
              {selectedTab === "messages" ? (
                <MessagesView messages={stageData.visibleMessages} findings={stageData.visibleReviews} />
              ) : null}
            </div>
          </div>
          <BottomCta />
        </div>
        <footer className="mt-8 border-t border-[--metis-outline-subtle] pt-4 text-[0.72rem] leading-relaxed text-[--metis-text-tertiary]">
          {towerBriefingDemo.disclaimer} · Public static demo · No login required
        </footer>
      </div>
    </main>
  );
}
