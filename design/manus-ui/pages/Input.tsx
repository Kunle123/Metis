/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Internal input is support for the brief.
 * Keep it attributable, linked, and compact. One dominant evidence surface, one support rail.
 */
import { Link } from "wouter";
import { ArrowRight, Link2, Lock, PencilLine, PlusCircle } from "lucide-react";
import { ConfidencePill, MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { stakeholderInputs } from "@/lib/metis-data";

const primaryInput = stakeholderInputs[0];

const captureState = [
  { label: "Linked section", value: primaryInput.linkedSection },
  { label: "Gap impact", value: "Resolves workaround horizon" },
  { label: "Readiness movement", value: "Updated since last version" },
] as const;

const operatorRules = [
  { icon: Link2, text: "Section link required" },
  { icon: Lock, text: "Visibility set" },
  { icon: PencilLine, text: "Attributable wording" },
] as const;

export default function InputPage() {
  return (
    <MetisShell activePath="/input" pageTitle="Internal Input" readinessState="Updated since last version">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-[Cormorant_Garamond] text-4xl leading-[0.96] text-[--metis-paper] sm:text-[3rem]">
                  Attributable input
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ConfidencePill level={primaryInput.confidence} />
                <ReadinessPill state="Updated since last version" />
              </div>
            </div>
          </div>

          <div className="border-b border-white/8 bg-[rgba(10,14,15,0.35)] px-6 py-3 sm:px-7">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.7rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
              <span>{primaryInput.role}</span>
              <span className="text-[--metis-paper]">{primaryInput.name}</span>
              <span>{primaryInput.timestamp}</span>
              <span>{primaryInput.visibility}</span>
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.56rem] uppercase tracking-[0.14em] text-[rgba(176,171,160,0.5)]">Current record</p>
                    <h3 className="mt-2 text-lg font-medium text-[--metis-paper]">
                      {primaryInput.role} · {primaryInput.name}
                    </h3>
                  </div>
                  <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{primaryInput.visibility}</Badge>
                </div>
                <p className="text-base leading-8 text-[--metis-paper]">{primaryInput.response}</p>
              </div>

              <div className="metis-surface metis-support-surface space-y-3 rounded-[1.2rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                {captureState.map((item) => (
                  <div key={item.label} className="space-y-2 border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">{item.label}</p>
                    <p className="text-sm leading-6 text-[--metis-paper]">{item.value}</p>
                  </div>
                ))}
                <div className="border-t border-white/8 pt-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Confidence</p>
                  <div className="mt-2">
                    <ConfidencePill level={primaryInput.confidence} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/8 pt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[Cormorant_Garamond] text-[1.75rem] leading-none text-[--metis-paper]">Linked inputs</h3>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{stakeholderInputs.length} records</Badge>
              </div>
              <div className="space-y-3">
                {stakeholderInputs.map((input) => (
                  <article key={input.id} className="rounded-[1.15rem] border border-white/8 bg-[rgba(255,255,255,0.035)] px-4 py-4 first:border-t first:pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{input.id}</Badge>
                          <h4 className="text-sm font-medium text-[--metis-paper]">
                            {input.role} · {input.name}
                          </h4>
                        </div>
                        <p className="mt-2 text-[0.72rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                          {input.timestamp} · {input.linkedSection} · {input.visibility}
                        </p>
                      </div>
                      <ConfidencePill level={input.confidence} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[--metis-paper-muted]">{input.response}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="space-y-4 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.18)] px-4 py-4">
                {operatorRules.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <Icon className="mt-2 h-4 w-4 text-[--metis-brass]" />
                      <p>{item.text}</p>
                    </div>
                  );
                })}
                <div className="space-y-3 border-t border-white/8 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Current effect</span>
                    <ReadinessPill state="Updated since last version" />
                  </div>
                  <p>Chronology updated. Exposure wording pending validation.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/brief">
                  <PlusCircle className="mr-2 h-4 w-4" />
Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/compare">
Open delta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
