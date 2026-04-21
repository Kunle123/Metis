/*
 * Metis design reminder for this file:
 * Editorial Situation Room. This screen is the product's center of gravity.
 * Treat the brief as the artifact, not the chrome around it. Keep support visible but secondary.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, FileOutput, Library, RefreshCcw, ScanSearch } from "lucide-react";
import { ConfidencePill, MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { briefSections, sourceItems, stakeholderInputs } from "@/lib/metis-data";
import type { ConfidenceLevel } from "@/lib/metis-data";
import type { ReadinessState } from "@/lib/metis-readiness";

type BriefMode = "full" | "executive";

const artifactMetadata = [
  { label: "Audience", value: "CEO, COO, GC" },
  { label: "Circulation", value: "Internal" },
  { label: "Last revision", value: "16:52 CET" },
  { label: "Open gaps", value: "4" },
];

const changeSummary = [
  "Disruption confirmed",
  "Exposure wording under validation",
  "Narrative pressure active",
];

const blockers = [
  {
    title: "Exposure wording still requires Security and Legal validation",
    owner: "IT / Legal",
    state: "Needs validation" as const,
  },
  {
    title: "Notification-threshold language is not yet settled",
    owner: "Legal / Compliance",
    state: "Open gap" as const,
  },
  {
    title: "Customer-facing holding language needs the latest comms draft",
    owner: "Customer Comms",
    state: "Updated since last version" as const,
  },
];

const executiveBlocks = [
  {
    label: "Situation",
    body:
      "A containment action on a shared identity layer disrupted customer self-service across three European markets. Service degradation is confirmed; unauthorized access remains unconfirmed.",
  },
  {
    label: "Current line",
    body:
      "Confirmed disruption now leads. Unauthorized access remains unverified. Security and Legal review remain first in sequence.",
  },
  {
    label: "Unresolved",
    body:
      "Unauthorized access remains unconfirmed. Notification thresholds remain unconfirmed. Customer-exposure language remains restricted.",
  },
  {
    label: "Circulation status",
    body:
      "Broader circulation on hold pending Security and Legal language on access, exposure, and notification implications.",
  },
  {
    label: "Immediate actions",
    body:
      "Approve a conservative internal summary, hold exposure claims until validation is complete, confirm customer-communications posture, and set the next update cadence.",
  },
];

const executiveActions = [
  "Approve conservative leadership wording for the next internal send.",
  "Require IT and Legal to confirm whether the issue is containment only or evidence of compromise.",
  "Confirm what Customer Comms can safely say if the issue moves beyond internal circulation.",
];

const displayTitles: Record<string, string> = {
  "executive-summary": "Executive summary",
  chronology: "Chronology",
  "confirmed-vs-unclear": "Confirmed vs unclear",
  "narrative-map": "Stakeholder narratives",
  implications: "Implications",
  "recommended-actions": "Recommended actions",
};

function sectionReadiness(confidence: ConfidenceLevel): ReadinessState {
  if (confidence === "Needs validation") return "Needs validation";
  if (confidence === "Unclear") return "Open gap";
  if (confidence === "Confirmed") return "Ready to circulate";
  return "Ready for review";
}

function resolveEvidenceRef(ref: string) {
  const source = sourceItems.find((item) => item.id === ref);
  if (source) {
    return {
      id: ref,
      title: source.title,
      meta: `${source.tier} · ${source.linkedSection}`,
      note: source.reliability,
    };
  }

  const input = stakeholderInputs.find((item) => item.id === ref);
  if (input) {
    return {
      id: ref,
      title: `${input.role} · ${input.name}`,
      meta: `${input.visibility} · ${input.linkedSection}`,
      note: input.confidence,
    };
  }

  return {
    id: ref,
    title: ref,
    meta: "Linked evidence",
    note: "In use",
  };
}

export default function Brief() {
  const [mode, setMode] = useState<BriefMode>("full");

  const appendixItems = useMemo(
    () => Array.from(new Set(briefSections.flatMap((section) => section.evidenceRefs))).map(resolveEvidenceRef),
    [],
  );

  const title = mode === "full" ? "Full Issue Brief" : "Executive Brief";

  return (
    <MetisShell activePath="/brief" pageTitle={title} readinessState="Ready for review">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="inline-flex rounded-full border border-white/8 bg-[rgba(0,0,0,0.14)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode("full")}
                    className={`rounded-full px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition ${
                      mode === "full"
                        ? "bg-[--metis-brass] text-[--metis-dark]"
                        : "text-[--metis-paper-muted] hover:text-[--metis-paper]"
                    }`}
                  >
                    Full issue brief
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("executive")}
                    className={`rounded-full px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition ${
                      mode === "executive"
                        ? "bg-[--metis-brass] text-[--metis-dark]"
                        : "text-[--metis-paper-muted] hover:text-[--metis-paper]"
                    }`}
                  >
                    Executive brief
                  </button>
                </div>
                <Button asChild className="rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                  <Link href="/export">
                    <FileOutput className="mr-2 h-4 w-4" />
                    Prepare output
                  </Link>
                </Button>
              </div>
          </div>

          {mode === "full" ? (
            <article className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
              <header className="space-y-5 border-b border-white/8 pb-8">
                <p className="max-w-4xl text-lg leading-8 text-[--metis-paper]">
                  Service degradation is confirmed across three European markets following security containment activity. Unauthorized access remains unconfirmed.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.62rem] uppercase tracking-[0.14em] text-[rgba(176,171,160,0.56)]">
                  {artifactMetadata.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      <span className="text-[rgba(244,238,228,0.88)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </header>

              <div className="space-y-8">
                {briefSections.map((section, index) => (
                  <section key={section.id} id={section.id} className={index === 0 ? "space-y-4" : "space-y-4 border-t border-white/8 pt-8"}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-[0.55rem] uppercase tracking-[0.14em] text-[rgba(176,171,160,0.44)]">0{index + 1}</p>
                        <h3 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">
                          {displayTitles[section.id] ?? section.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <ConfidencePill level={section.confidence} />
                        <ReadinessPill state={sectionReadiness(section.confidence)} />
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Updated {section.updatedAt}</Badge>
                      </div>
                    </div>

                    <p className="max-w-4xl text-base leading-8 text-[--metis-paper]">{section.body}</p>

                    <div className="flex flex-wrap gap-2 border-t border-white/8 pt-4">
                      {section.evidenceRefs.map((ref) => (
                        <Badge key={ref} className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">
                          {ref}
                        </Badge>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <section className="space-y-3 border-t border-white/8 pt-7">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.68)]">Sources appendix</h3>
                  <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{appendixItems.length} entries</Badge>
                </div>
                <div className="space-y-4">
                  {appendixItems.map((item) => (
                    <div key={item.id} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[--metis-paper]">
                            {item.id} · {item.title}
                          </p>
                          <p className="mt-1 text-[0.72rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">{item.meta}</p>
                        </div>
                        <Badge className="w-fit border-0 bg-white/8 text-[--metis-paper-muted]">{item.note}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          ) : (
            <article className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
              <header className="space-y-4 border-b border-white/8 pb-8">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">CEO, COO, GC</p>
                <p className="max-w-4xl text-lg leading-8 text-[--metis-paper]">
                  Service disruption is confirmed. Unauthorized access remains unconfirmed. Exposure wording remains under validation.
                </p>
              </header>

              <div className="space-y-8">
                {executiveBlocks.map((block, index) => (
                  <section key={block.label} className={index === 0 ? "space-y-3" : "space-y-3 border-t border-white/8 pt-8"}>
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">{block.label}</p>
                    <p className="max-w-4xl text-lg leading-8 text-[--metis-paper]">{block.body}</p>
                  </section>
                ))}
              </div>

              <section className="space-y-4 border-t border-white/8 pt-8">
                <h3 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Immediate actions</h3>
                <div className="space-y-4">
                  {executiveActions.map((item) => (
                    <div key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 text-base leading-7 text-[--metis-paper]">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[--metis-brass]" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          )}
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.16)] px-4 py-4 text-sm leading-6 text-[--metis-paper-muted]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Readiness</span>
                  <ReadinessPill state="Ready for review" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Change</span>
                  <ReadinessPill state="Updated since last version" />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Open gaps</span>
                  <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">4</Badge>
                </div>
                <div className="space-y-2 border-t border-white/8 pt-3">
                  {changeSummary.map((item) => (
                    <div key={item} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2.5 text-sm leading-6">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[--metis-brass]" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.16)] px-4 py-4">
                <div className="flex items-center gap-2 text-[--metis-paper]">
                  <AlertTriangle className="h-4 w-4 text-[--metis-brass]" />
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Blockers</p>
                </div>
                <div className="space-y-3">
                  {blockers.map((item) => (
                    <div key={item.title} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                        <ReadinessPill state={item.state} />
                      </div>
                      <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Owner · {item.owner}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 border-t border-white/8 pt-3">
                  <div className="flex items-center gap-2 text-[--metis-paper]">
                    <Library className="h-4 w-4 text-[--metis-brass]" />
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Evidence</p>
                  </div>
                  {stakeholderInputs.slice(0, 3).map((input) => (
                    <div key={input.id} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[--metis-paper]">
                            {input.role} · {input.name}
                          </p>
                          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                            {input.linkedSection} · {input.timestamp}
                          </p>
                        </div>
                        <ConfidencePill level={input.confidence} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/compare">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                    Open delta
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/sources">
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Open sources
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
