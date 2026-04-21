/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Sources is evidence support for the brief.
 * Keep one dominant ledger, minimal narration, and one compact support rail.
 */
import { Link } from "wouter";
import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sourceItems } from "@/lib/metis-data";

const tierOrder = ["Official", "Internal", "Major media", "Market signal"] as const;

const tierTone: Record<(typeof tierOrder)[number], string> = {
  Official: "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50",
  Internal: "border-0 bg-[rgba(118,84,26,0.5)] text-[rgba(255,237,202,0.98)]",
  "Major media": "border-0 bg-[rgba(20,84,118,0.54)] text-sky-50",
  "Market signal": "border border-white/12 bg-[rgba(52,69,91,0.52)] text-slate-100",
};

const tierCounts = tierOrder.map((tier) => ({
  tier,
  count: sourceItems.filter((item) => item.tier === tier).length,
}));

const orderedSources = tierOrder.flatMap((tier) => sourceItems.filter((item) => item.tier === tier));

const sourceNoteOverrides: Record<string, string> = {
  "SRC-01": "Operational chronology from incident bridge.",
  "SRC-02": "Latest wording on access uncertainty.",
  "SRC-03": "Terminology constraints pending threshold review.",
  "SRC-04": "Early external cause speculation.",
  "SRC-05": "Inbound ticket escalation data.",
  "SRC-06": "Threshold guidance for notification decisions.",
  "SRC-07": "Current holding statement wording.",
  "SRC-08": "Board sensitivity context.",
};

const sectionPosture = [
  {
    title: "Executive Summary",
    state: "Ready for review" as const,
    detail: "Internal",
  },
  {
    title: "Confirmed vs Unclear",
    state: "Needs validation" as const,
    detail: "Exposure wording open",
  },
  {
    title: "Narrative Map",
    state: "Source conflict" as const,
    detail: "External line ahead of confirmed fact",
  },
];

export default function Sources() {
  return (
    <MetisShell activePath="/sources" pageTitle="Sources" readinessState="Needs validation">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-end gap-2">
                {tierCounts.map((item) => (
                  <Badge key={item.tier} className={tierTone[item.tier]}>
                    {item.tier}: {item.count}
                  </Badge>
                ))}
              </div>
            </div>

          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <div className="space-y-4">
              {orderedSources.map((item) => {
                const sourceState = item.tier === "Official" || item.tier === "Internal" ? "Ready for review" : "Needs validation";
                const usageLabel = item.tier === "Major media" || item.tier === "Market signal" ? "Signal" : "In brief";
                const sourceNote = sourceNoteOverrides[item.id] ?? item.note;

                return (
                  <article key={item.id} className="rounded-[1.45rem] border border-white/10 bg-[rgba(255,255,255,0.055)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{item.id}</Badge>
                          <Badge className={tierTone[item.tier]}>{item.tier}</Badge>
                          <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{item.timestamp}</Badge>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-medium text-[--metis-paper]">{item.title}</h3>
                          <p className="text-sm leading-6 text-[--metis-paper-muted]">{sourceNote}</p>
                        </div>
                      </div>
                      <ReadinessPill state={sourceState} />
                    </div>

                    <div className="mt-4 border-t border-white/8 pt-4">
                      <p className="text-base leading-8 text-[--metis-paper]">“{item.snippet}”</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/8 pt-4 text-xs text-[--metis-paper-muted]">
                      <span className="inline-flex items-center gap-2 text-[--metis-paper]">
                        <Link2 className="h-3.5 w-3.5 text-[--metis-brass]" />
                        {item.linkedSection}
                      </span>
                      <span>•</span>
                      <span>{item.reliability}</span>
                      <span>•</span>
                      <span>{usageLabel}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="space-y-3 px-5 py-5">
              {sectionPosture.map((item) => (
                <div key={item.title} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[--metis-paper-muted]">{item.detail}</p>
                    </div>
                    <ReadinessPill state={item.state} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="flex items-center gap-3 text-[--metis-paper]">
                <ShieldCheck className="h-4 w-4 text-[--metis-brass]" />
                <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Conflicts</h3>
              </div>
              <div className="border-t border-white/8 pt-4">
                <p className="text-sm leading-6 text-[--metis-paper-muted]">2 open conflicts</p>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/brief">
Open brief
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                  <Link href="/gaps">Open gaps</Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
