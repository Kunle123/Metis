import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, FileOutput, RefreshCcw, ScanSearch, TrendingUp } from "lucide-react";

import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { BriefModeSchema, BriefArtifactSchema, type BriefMode, type BriefArtifact } from "@metis/shared/briefVersion";
import type { CompareGroupId, CompareSummary, CirculationState } from "@metis/shared/compare";
import { compareBriefArtifacts } from "@/lib/brief/compareBriefVersions";

export const dynamic = "force-dynamic";

function groupTitle(id: CompareGroupId) {
  if (id === "new_facts") return "New facts";
  if (id === "changed_assumptions") return "Changed assumptions";
  if (id === "resolved_uncertainties") return "Resolved uncertainties";
  return "Changed recommendations";
}

function groupState(id: CompareGroupId): CirculationState {
  if (id === "changed_assumptions") return "Needs validation";
  if (id === "resolved_uncertainties") return "Ready for review";
  return "Updated since last version";
}

function versionLabel(v: { versionNumber: number; createdAt: Date }) {
  const date = v.createdAt.toLocaleString();
  return `v${v.versionNumber} · ${date}`;
}

function summarizeArtifact(artifact: BriefArtifact) {
  const primary = artifact.full.sections.find((s) => s.id === "executive-summary")?.body ?? artifact.lede;
  return primary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function getLatestTwo(issueId: string, mode: BriefMode) {
  return prisma.briefVersion.findMany({
    where: { issueId, mode },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
}

export default async function IssueComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ issueId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { issueId } = await params;
  const sp = (await searchParams) ?? {};
  const modeRaw = typeof sp.mode === "string" ? sp.mode : Array.isArray(sp.mode) ? sp.mode[0] : undefined;
  const parsedMode = BriefModeSchema.safeParse(modeRaw ?? "full");
  const mode = parsedMode.success ? parsedMode.data : ("full" as const);

  const issue = await getIssueById(issueId);
  if (!issue) {
    return (
      <MetisShell activePath="/compare" pageTitle="Brief Delta" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const versions = await getLatestTwo(issue.id, mode);
  const current = versions[0] ?? null;
  const prior = versions[1] ?? null;

  // 0 versions: show empty state.
  if (!current) {
    return (
      <MetisShell
        activePath="/compare"
        pageTitle="Brief Delta"
        issueRoutePrefix={`/issues/${issue.id}`}
        activeIssue={{
          title: issue.title,
          severity: issue.severity,
          openGapsCount: issue.openGapsCount,
          updatedAt: issue.updatedAt,
        }}
      >
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">No brief versions yet.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const currentArtifact = BriefArtifactSchema.parse(current.artifact) as BriefArtifact;
  const currentSummary = summarizeArtifact(currentArtifact);

  let compare: { summary: CompareSummary; changeCount: number; persisted: boolean };
  let priorArtifact: BriefArtifact | null = null;
  let priorSummary: string[] = [];

  if (!prior) {
    compare = { summary: compareBriefArtifacts(currentArtifact, currentArtifact), changeCount: 0, persisted: false };
  } else {
    priorArtifact = BriefArtifactSchema.parse(prior.artifact) as BriefArtifact;
    priorSummary = summarizeArtifact(priorArtifact);

    const existing = await prisma.briefComparison.findUnique({
      where: { fromBriefVersionId_toBriefVersionId: { fromBriefVersionId: prior.id, toBriefVersionId: current.id } },
    });

    const summary = existing ? (existing.summary as any) : compareBriefArtifacts(priorArtifact, currentArtifact);
    const changeCount = existing ? existing.changeCount : summary.groups.reduce((acc: number, g: any) => acc + g.items.length, 0);
    compare = { summary, changeCount, persisted: Boolean(existing) };
  }

  const deltaGroups = compare.summary.groups.map((g) => ({
    title: groupTitle(g.id),
    state: groupState(g.id),
    items: g.items,
  }));

  const readinessMovement = compare.summary.readinessMovement ?? [];

  return (
    <MetisShell
      activePath="/compare"
      pageTitle="Brief Delta"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(176,171,160,0.62)]">
                {prior ? `${versionLabel(prior)} → ${versionLabel(current)}` : versionLabel(current)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(112,191,232,0.48)] bg-[rgba(19,86,118,0.6)] px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-sky-50 ring-1 ring-[rgba(138,214,250,0.2)] shadow-[0_10px_24px_rgba(14,48,73,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]">
                  Updated
                </span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{compare.changeCount} changes</Badge>
              </div>
            </div>
          </div>

          <article className="space-y-8 px-7 py-8 sm:px-8">
            <section className="grid gap-5 xl:grid-cols-2">
              <div className="metis-surface metis-support-surface rounded-[1.35rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Prior</p>
                <div className="mt-4 space-y-3">
                  {prior ? (
                    priorSummary.map((item) => (
                      <div key={item} className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper-muted]">
                        <span className="mt-3 h-1.5 w-1.5 rounded-full bg-white/30" />
                        <p>{item}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-[--metis-paper-muted]">No prior version yet.</p>
                  )}
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
                      {group.items.length ? (
                        group.items.map((item) => (
                          <div key={item} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper]">
                            <span className="mt-3 h-1.5 w-1.5 rounded-full bg-[--metis-brass]" />
                            <p>{item}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm leading-7 text-[--metis-paper-muted]">No changes recorded.</p>
                      )}
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
              {readinessMovement.length ? (
                readinessMovement.map((item) => (
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
                ))
              ) : (
                <p className="text-sm leading-6 text-[--metis-paper-muted]">No readiness movement tracked yet.</p>
              )}
            </div>

            <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Circulation state</p>
              <div className="border-t border-white/8 pt-4">
                <div className="flex flex-wrap gap-2">
                  <ReadinessPill state="Ready for review" />
                  <ReadinessPill state="Needs validation" />
                </div>
                <div className="mt-3 space-y-1">
                  <p>{current.circulationNotes ?? "Internal review open."}</p>
                  <p>Wider circulation held.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href={`/issues/${issue.id}/export`}>
                  <FileOutput className="mr-2 h-4 w-4" />
                  Open export
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href={`/issues/${issue.id}/brief?mode=${mode}`}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href={`/issues/${issue.id}/sources`}>
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

