import Link from "next/link";
import { AlertTriangle, FileOutput, Library, RefreshCcw, ScanSearch } from "lucide-react";

import { ConfidencePill, SurfaceCard, MetisShell } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { BriefModeSchema, type BriefMode, type BriefConfidence, type BriefArtifact } from "@metis/shared/briefVersion";
import { GenerateBriefButton } from "@/app/brief/generate-brief-button";

export const dynamic = "force-dynamic";

function readinessFromConfidence(confidence: BriefConfidence) {
  if (confidence === "Needs validation") return { label: "Needs validation", tone: "bg-[rgba(118,27,46,0.56)] text-rose-50" };
  if (confidence === "Unclear") return { label: "Needs clarification", tone: "bg-[rgba(131,82,17,0.72)] text-amber-50" };
  if (confidence === "Confirmed") return { label: "Ready to circulate", tone: "bg-[rgba(18,91,60,0.76)] text-emerald-50" };
  return { label: "Ready for review", tone: "bg-[rgba(49,63,82,0.72)] text-slate-50" };
}

function displayTitles(id: string, fallback: string) {
  const map: Record<string, string> = {
    "executive-summary": "Executive summary",
    chronology: "Chronology",
    "confirmed-vs-unclear": "Confirmed vs unclear",
    "narrative-map": "Stakeholder narratives",
    implications: "Implications",
    "recommended-actions": "Recommended actions",
  };
  return map[id] ?? fallback;
}

async function getLatestBriefVersion(issueId: string, mode: BriefMode) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return null;

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId, mode },
    orderBy: { createdAt: "desc" },
  });

  if (latest && latest.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime()) return latest;
  return latest;
}

export default async function IssueBriefPage({
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
      <MetisShell activePath="/brief" pageTitle="Full Issue Brief" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const briefVersion = await getLatestBriefVersion(issue.id, mode);
  const artifact = (briefVersion?.artifact ?? null) as BriefArtifact | null;
  const linkedSources = await prisma.source.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const title = mode === "full" ? "Full Issue Brief" : "Executive Brief";
  const artifactMetadata = artifact
    ? ([
        { label: "Audience", value: artifact.metadata.audience ?? "—" },
        { label: "Circulation", value: artifact.metadata.circulation },
        { label: "Last revision", value: artifact.metadata.lastRevisionLabel },
        { label: "Clarification gaps", value: artifact.metadata.openGapsLabel },
      ] as const)
    : ([] as const);

  const sections = artifact?.full.sections ?? [];
  const changeSummary = sections.slice(0, 3).map((s) => displayTitles(s.id, s.title));
  const blockers = sections
    .filter((s) => s.confidence === "Needs validation" || s.confidence === "Unclear")
    .slice(0, 3)
    .map((s) => ({
      title: `${displayTitles(s.id, s.title)} needs ${s.confidence === "Unclear" ? "clarification" : "validation"}`,
      owner: "—",
      confidence: s.confidence,
    }));

  const evidenceItems = linkedSources.slice(0, 12);

  return (
    <MetisShell
      activePath="/brief"
      pageTitle={title}
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard>
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-6 text-[--metis-paper-muted]">Produce the executive output for the issue.</p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[0.58rem] font-medium uppercase tracking-[0.22em] text-[--metis-ink-soft]">Brief mode</span>
                  <div
                    role="group"
                    aria-label="Brief mode"
                    className="inline-flex overflow-hidden rounded-full border border-white/14 bg-[rgba(0,0,0,0.32)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                  <Link
                    href={`/issues/${issue.id}/brief?mode=full`}
                    aria-current={mode === "full" ? "page" : undefined}
                    className={`inline-flex min-h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0e0f] ${
                      mode === "full"
                        ? "bg-[--metis-brass] font-semibold text-[--metis-dark]"
                        : "bg-transparent text-[rgba(176,171,160,0.52)] hover:bg-white/[0.06] hover:text-[--metis-paper]"
                    }`}
                  >
                    Full brief
                  </Link>
                  <Link
                    href={`/issues/${issue.id}/brief?mode=executive`}
                    aria-current={mode === "executive" ? "page" : undefined}
                    className={`inline-flex min-h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap px-3.5 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0e0f] ${
                      mode === "executive"
                        ? "bg-[--metis-brass] font-semibold text-[--metis-dark]"
                        : "bg-transparent text-[rgba(176,171,160,0.52)] hover:bg-white/[0.06] hover:text-[--metis-paper]"
                    }`}
                  >
                    Executive brief
                  </Link>
                  </div>
                </div>
                <Button asChild className="rounded-full bg-[--metis-brass] text-[--metis-dark] shadow-[0_2px_10px_rgba(0,0,0,0.45)] ring-1 ring-white/15 hover:bg-[--metis-brass-soft] focus-visible:ring-2 focus-visible:ring-[--metis-brass-soft] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e0f]">
                  <Link href={`/issues/${issue.id}/export?mode=${mode}`}>
                    <FileOutput className="mr-2 h-4 w-4" />
                    Prepare output
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {artifact ? (
            mode === "full" ? (
              <article className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
                <header className="space-y-5 border-b border-white/8 pb-8">
                  <p className="max-w-4xl text-lg leading-8 text-[--metis-paper]">{artifact.lede}</p>
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
                  {artifact.full.sections.map((section, index) => {
                    const readiness = readinessFromConfidence(section.confidence);
                    return (
                      <section key={section.id} id={section.id} className={index === 0 ? "space-y-4" : "space-y-4 border-t border-white/8 pt-8"}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-[0.55rem] uppercase tracking-[0.14em] text-[rgba(176,171,160,0.44)]">0{index + 1}</p>
                            <h3 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">
                              {displayTitles(section.id, section.title)}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <ConfidencePill level={section.confidence} />
                            <Badge className={`border-0 ${readiness.tone}`}>{readiness.label}</Badge>
                            <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Updated {section.updatedAtLabel}</Badge>
                          </div>
                        </div>

                        <p className="max-w-4xl whitespace-pre-line text-base leading-8 text-[--metis-paper]">{section.body}</p>
                      </section>
                    );
                  })}
                </div>

                <section className="space-y-3 border-t border-white/8 pt-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.68)]">Sources appendix</h3>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{linkedSources.length} entries</Badge>
                  </div>
                  <div className="space-y-4">
                    {linkedSources.map((s) => (
                      <div key={s.id} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-[--metis-paper]">
                              {s.sourceCode} · {s.title}
                            </p>
                            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">
                              {s.tier} · {s.linkedSection ?? "—"}
                            </p>
                          </div>
                          <Badge className="w-fit border-0 bg-white/8 text-[--metis-paper-muted]">{s.reliability ?? "In use"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </article>
            ) : (
              <article className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
                <header className="space-y-4 border-b border-white/8 pb-8">
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                    {artifact.metadata.audience ?? "Internal"}
                  </p>
                  <p className="max-w-4xl text-lg leading-8 text-[--metis-paper]">{artifact.lede}</p>
                </header>
              </article>
            )
          ) : (
            <article className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
              <header className="space-y-3 border-b border-white/8 pb-6">
                <h2 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">No brief version yet</h2>
                <p className="max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
                  Generate the first-pass brief artifact from the current issue record. This will create a stored brief version for this mode.
                </p>
              </header>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                  Mode · <span className="text-[--metis-paper]">{mode === "full" ? "Full issue brief" : "Executive brief"}</span>
                </div>
                <GenerateBriefButton issueId={issue.id} mode={mode} />
              </div>
            </article>
          )}
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface">
          <div className="divide-y divide-white/8">
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 rounded-[1.2rem] border border-white/8 bg-[rgba(0,0,0,0.16)] px-4 py-4 text-sm leading-6 text-[--metis-paper-muted]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Status</span>
                  <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issue.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Clarification gaps</span>
                  <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">{issue.openGapsCount}</Badge>
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
                  {blockers.length ? (
                    blockers.map((item) => (
                      <div key={item.title} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                          <ConfidencePill level={item.confidence} />
                        </div>
                        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Owner · {item.owner}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[--metis-paper-muted]">No blockers detected.</p>
                  )}
                </div>

                <div className="space-y-3 border-t border-white/8 pt-3">
                  <div className="flex items-center gap-2 text-[--metis-paper]">
                    <Library className="h-4 w-4 text-[--metis-brass]" />
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Evidence</p>
                  </div>
                  {evidenceItems.length ? (
                    evidenceItems.map((s) => (
                      <div key={s.id} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-[--metis-paper]">{s.sourceCode}</p>
                            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                              {s.tier} · {s.linkedSection ?? "—"}
                            </p>
                          </div>
                          <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{s.reliability ?? "In use"}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[--metis-paper-muted]">No evidence linked yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href={`/issues/${issue.id}/sources`}>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Open sources
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href={`/issues/${issue.id}/compare`}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Open delta
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

