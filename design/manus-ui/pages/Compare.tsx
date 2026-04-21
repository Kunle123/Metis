/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Compare is not generic diffing.
 * It should read like a delta memo for the brief: what changed,
 * what got safer, what remains unresolved, and whether circulation posture moved.
 */
import { Link } from "wouter";
import { ArrowDownRight, ArrowUpRight, FileOutput, RefreshCcw, ScanSearch, TrendingUp } from "lucide-react";
import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { versionSnapshots } from "@/lib/metis-data";

const deltaGroups = [
  {
    title: "New facts",
    state: "Updated since last version" as const,
    items: [
      "Support volume now tied to live operational reporting.",
      "Workaround horizon now supports chronology.",
    ],
  },
  {
    title: "Changed assumptions",
    state: "Needs validation" as const,
    items: [
      "Unauthorized access remains unverified.",
      "Exposure wording remains limited pending Security and Legal review.",
    ],
  },
  {
    title: "Resolved uncertainties",
    state: "Ready for review" as const,
    items: [
      "Customer-friction timing now stable in chronology.",
      "One operational gap returned to the brief.",
    ],
  },
  {
    title: "Changed recommendations",
    state: "Updated since last version" as const,
      items: [
      "Customer Comms review added before wider circulation.",
      "Next update cadence added.",
    ],
  },
];

const readinessMovement = [
  {
    label: "Executive clarity",
    from: "Needs validation",
    to: "Updated since last version",
    direction: "improved",
    detail: "Disruption separated from breach implication",
  },
  {
    label: "Internal review",
    from: "Ready for review",
    to: "Ready for review",
    direction: "stable",
    detail: "Internal review still open",
  },
  {
    label: "Broader circulation",
    from: "Needs validation",
    to: "Needs validation",
    direction: "stable",
    detail: "Exposure wording still blocks wider circulation",
  },
];

const priorSummary = [
  "Exposure wording too loose",
  "Customer Comms review missing",
  "Notification threshold unresolved",
];

const currentSummary = [
  "Confirmed disruption separated from unverified compromise",
  "Review order: Legal, IT, Customer Comms",
  "Internal review open; wider circulation held",
];

const priorVersion = versionSnapshots[Math.max(versionSnapshots.length - 2, 0)];
const currentVersion = versionSnapshots[Math.max(versionSnapshots.length - 1, 0)];

export default function Compare() {
  return (
    <MetisShell activePath="/compare" pageTitle="Brief Delta" readinessState="Updated since last version">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(176,171,160,0.62)]">{priorVersion.label} → {currentVersion.label}</p>
              <div className="flex flex-wrap items-center gap-2">
                <ReadinessPill state="Updated since last version" />
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">7 changes</Badge>
              </div>
            </div>
          </div>

          <article className="space-y-8 px-7 py-8 sm:px-8">
            <section className="grid gap-5 xl:grid-cols-2">
              <div className="metis-surface metis-support-surface rounded-[1.35rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Prior</p>
                <div className="mt-4 space-y-3">
                  {priorSummary.map((item) => (
                    <div key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper-muted]">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-white/30" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-[rgba(224,183,111,0.22)] bg-[linear-gradient(180deg,rgba(224,183,111,0.12),rgba(255,255,255,0.04))] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Current</p>
                <div className="mt-4 space-y-3">
                  {currentSummary.map((item) => (
                    <div key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper]">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[--metis-brass]" />
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/8 pt-8">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Changes</h3>
              </div>
              <div className="space-y-4">
                {deltaGroups.map((group) => (
                  <section key={group.title} className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-lg font-medium text-[--metis-paper]">{group.title}</h4>
                      <ReadinessPill state={group.state} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.items.map((item) => (
                        <div key={item} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper]">
                          <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[--metis-brass]" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </article>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="space-y-4 px-5 py-5">
              {readinessMovement.map((item) => (
                <div key={item.label} className="space-y-3 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[--metis-paper]">{item.label}</p>
                    <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                      <span>{item.from}</span>
                      {item.direction === "improved" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                      ) : item.direction === "worsened" ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-300" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 text-[--metis-brass-soft]" />
                      )}
                      <span>{item.to}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Circulation state</p>
              <div className="border-t border-white/8 pt-4">
                <div className="flex flex-wrap gap-2">
                  <ReadinessPill state="Ready for review" />
                  <ReadinessPill state="Needs validation" />
                </div>
                <div className="mt-3 space-y-1">
                  <p>Internal review open.</p>
                  <p>Wider circulation held.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/export">
                  <FileOutput className="mr-2 h-4 w-4" />
Open export
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/brief">
                  <RefreshCcw className="mr-2 h-4 w-4" />
Open brief
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
