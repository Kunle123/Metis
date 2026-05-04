import Link from "next/link";
import { AlertTriangle, FileOutput, Library, RefreshCcw, ScanSearch } from "lucide-react";

import { ConfidencePill, SurfaceCard, MetisShell } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { BriefModeSchema, type BriefMode, type BriefConfidence, type BriefArtifact } from "@metis/shared/briefVersion";
import { GenerateBriefButton } from "@/app/brief/generate-brief-button";
import { IntakeSuggestionsPanel } from "@/app/issues/[issueId]/brief/intake-suggestions-panel";
import { BriefModeToggle } from "@/app/issues/[issueId]/brief/brief-mode-toggle";
import { BriefExecutiveSummaryCompare } from "@/app/issues/[issueId]/brief/brief-executive-summary-compare";

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
    chronology: "Background and context",
    "confirmed-vs-unclear": "Current position and open questions",
    "narrative-map": "Stakeholder narratives",
    implications: "Risks and sensitivities",
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
  const fromSetup = typeof sp.from === "string" ? sp.from : Array.isArray(sp.from) ? sp.from[0] : undefined;
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
  const hasBriefForMode = Boolean(artifact);
  const briefSyncHint = (() => {
    if (!hasBriefForMode) {
      return "No stored brief for this mode.";
    }
    if (!briefVersion) return null;
    const inSync = issue.updatedAt.getTime() === briefVersion.generatedFromIssueUpdatedAt.getTime();
    return inSync
      ? "Matches the current issue record."
      : "Issue or linked data changed since this was generated; regenerate to refresh.";
  })();
  const briefInSync = Boolean(
    artifact && briefVersion && issue.updatedAt.getTime() === briefVersion.generatedFromIssueUpdatedAt.getTime(),
  );
  const linkedSources = await prisma.source.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  const title = mode === "full" ? "Full Issue Brief" : "Executive Brief";
  const artifactMetadata = artifact
    ? ([
        ...(mode === "executive" ? ([] as const) : ([{ label: "Audience", value: artifact.metadata.audience ?? "—" }] as const)),
        { label: "Circulation", value: artifact.metadata.circulation },
        { label: "Last revision", value: artifact.metadata.lastRevisionLabel },
        { label: "Open questions", value: artifact.metadata.openGapsLabel },
      ] as const)
    : ([] as const);

  const sections = artifact?.full.sections ?? [];
  const changeSummary =
    mode === "executive" && artifact
      ? artifact.executive.blocks.map((b) => b.label).slice(0, 6)
      : sections.slice(0, 3).map((s) => displayTitles(s.id, s.title));

  const fullSectionBlockers = sections
    .filter((s) => s.confidence === "Needs validation" || s.confidence === "Unclear")
    .slice(0, 3)
    .map((s) => ({
      title: `${displayTitles(s.id, s.title)} needs ${s.confidence === "Unclear" ? "clarification" : "validation"}`,
      owner: "—",
      confidence: s.confidence,
    }));

  const executiveRailBlockers: { title: string; owner: string; confidence: BriefConfidence }[] = (() => {
    if (mode !== "executive" || !artifact) return [];
    const out: { title: string; owner: string; confidence: BriefConfidence }[] = [];
    const hasConfirmed = Boolean(String(issue.confirmedFacts ?? "").trim());
    if (!hasConfirmed) {
      out.push({ title: "No client-confirmed facts on file in intake", owner: "—", confidence: "Unclear" });
    }
    if (issue.openGapsCount > 0) {
      out.push({ title: "Open questions remain in play", owner: "—", confidence: "Unclear" });
    }
    if (linkedSources.length === 0) {
      out.push({ title: "Narrative is not yet supported by linked sources", owner: "—", confidence: "Needs validation" });
    }
    if (issue.status.toLowerCase().includes("validation")) {
      out.push({ title: "Record status still signals validation in flight", owner: "—", confidence: "Needs validation" });
    }
    return out.slice(0, 3);
  })();

  const blockers = mode === "executive" && artifact ? executiveRailBlockers : fullSectionBlockers;

  const evidenceItems = linkedSources.slice(0, 12);
  const briefAiSynthesisEnabled = process.env.BRIEF_AI_SYNTHESIS_ENABLED === "true";
  const storedBriefRevisionLabel = briefVersion
    ? `${mode === "full" ? "Full" : "Executive"} brief v${briefVersion.versionNumber}`
    : null;

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
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="min-w-0 overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.015)] px-5 py-2.5 sm:px-6">
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-3 lg:gap-y-2">
                  <div className="flex items-center gap-2 text-[--metis-text-secondary]">
                    <Library className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                    <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em]">Brief workspace</span>
                  </div>
                  <BriefModeToggle issueId={issue.id} mode={mode} />
                  {storedBriefRevisionLabel ? (
                    <span className="rounded-full border border-[--metis-outline-subtle] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[0.68rem] font-medium tracking-wide text-[--metis-text-primary]">
                      {storedBriefRevisionLabel}
                    </span>
                  ) : (
                    <span className="text-[0.72rem] leading-snug text-[--metis-text-secondary]">No stored brief yet</span>
                  )}
                  {briefVersion ? (
                    <span
                      className={
                        briefInSync
                          ? "rounded-full border border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-neutral-fg]"
                          : "rounded-full border border-[--metis-status-info-border] bg-[--metis-status-info-bg] px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-info-fg]"
                      }
                    >
                      {briefInSync ? "Up to date" : "Stale"}
                    </span>
                  ) : null}
                  {briefVersion && !briefInSync ? (
                    <span className="hidden max-w-xl text-[0.8rem] leading-snug text-[--metis-text-secondary] xl:inline">
                      Refresh this brief because the issue changed after it was generated.
                    </span>
                  ) : !briefVersion ? (
                    <span className="hidden max-w-xl text-[0.8rem] leading-snug text-[--metis-text-secondary] xl:inline">
                      Generate a brief from the current issue record.
                    </span>
                  ) : null}
                  {briefSyncHint ? (
                    <span className="hidden max-w-xl text-[0.8rem] leading-snug text-[--metis-text-secondary] xl:inline">{briefSyncHint}</span>
                  ) : null}
                </div>
              }
              right={
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:justify-end lg:mt-0">
                  <GenerateBriefButton
                    issueId={issue.id}
                    mode={mode}
                    label={hasBriefForMode ? "Regenerate brief" : "Generate brief"}
                    syncHint={briefSyncHint}
                  />
                  <Button asChild variant="outline" className="h-9 rounded-full px-4">
                    <Link
                      href={`/issues/${issue.id}/export?mode=${mode}&format=${mode === "executive" ? "executive-brief" : "full-issue-brief"}`}
                    >
                      <FileOutput className="mr-2 h-4 w-4" />
                      Prepare output
                    </Link>
                  </Button>
                </div>
              }
            />
          </div>

          {fromSetup === "setup" ? <IntakeSuggestionsPanel issueId={issue.id} /> : null}

          {artifact ? (
            mode === "full" ? (
              <article className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
                <div className="space-y-0 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] px-4 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-6">
                  {artifact.full.sections.map((section, index) => {
                    const readiness = readinessFromConfidence(section.confidence);
                    return (
                      <DenseSection
                        key={section.id}
                        title={
                          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <span className="text-[0.55rem] uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="text-base font-semibold leading-6 text-[--metis-text-primary]">
                                {displayTitles(section.id, section.title)}
                              </span>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-[--metis-text-secondary]">
                              {readiness.label} · Updated {section.updatedAtLabel}
                            </span>
                          </div>
                        }
                        className={index === 0 ? "border-t-0 pt-0" : undefined}
                      >
                        {section.id === "executive-summary" ? (
                          <BriefExecutiveSummaryCompare
                            deterministicBody={section.body}
                            synthesis={artifact.full.executiveSummarySynthesis}
                            briefAiSynthesisEnabled={briefAiSynthesisEnabled}
                          />
                        ) : (
                          <p className="max-w-4xl whitespace-pre-line leading-7 text-[--metis-text-secondary]">{section.body}</p>
                        )}
                      </DenseSection>
                    );
                  })}
                  </div>
                </div>
              </article>
            ) : (
              <article className="px-5 pb-6 pt-4 sm:px-7 sm:pb-7 sm:pt-5">
                <header className="mb-6 space-y-4 border-b border-[--metis-outline-subtle] pb-6">
                  <h2 className="font-[Cormorant_Garamond] text-[1.85rem] leading-tight text-[--metis-text-primary]">{issue.title}</h2>
                  <p className="max-w-4xl text-sm leading-7 text-[--metis-text-secondary]">{artifact.lede}</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                    <span>
                      Circulation ·{" "}
                      <span className="normal-case tracking-normal text-[--metis-text-primary]">{artifact.metadata.circulation}</span>
                    </span>
                    <span>
                      Last revision ·{" "}
                      <span className="normal-case tracking-normal text-[--metis-text-primary]">{artifact.metadata.lastRevisionLabel}</span>
                    </span>
                    <span>
                      Open questions ·{" "}
                      <span className="normal-case tracking-normal text-[--metis-text-primary]">{artifact.metadata.openGapsLabel}</span>
                    </span>
                  </div>
                </header>
                <div className="space-y-0 rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[--metis-surface-card] px-4 py-5 sm:px-6 sm:py-6">
                  <div className="space-y-6">
                  {artifact.executive.blocks.map((block, index) => (
                    <DenseSection
                      key={`${block.label}-${index}`}
                      title={<span className="text-base font-semibold leading-6 text-[--metis-text-primary]">{block.label}</span>}
                      className={index === 0 ? "border-t-0 pt-0" : undefined}
                    >
                      <p className="max-w-4xl whitespace-pre-line leading-7 text-[--metis-text-secondary]">{block.body}</p>
                    </DenseSection>
                  ))}
                  </div>
                </div>
              </article>
            )
          ) : (
            <article className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
              <header className="space-y-3 border-b border-white/8 pb-6">
                <h2 className="font-[Cormorant_Garamond] text-[2.15rem] leading-none text-[--metis-paper]">No brief version yet</h2>
                <p className="max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
                  {fromSetup === "setup"
                    ? "This issue record has been created. Use Generate brief in the control bar above to build from the issue record, sources, open questions, observations, and Messages audience group selection (organisation-level audiences from Settings → Audience groups)."
                    : "Use Generate brief in the control bar above. Metis will create a stored brief for this mode from the issue record, sources, open questions, observations, and Messages audience group selection (organisation-level audiences from Settings → Audience groups)."}
                </p>
              </header>
              <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                Mode · <span className="text-[--metis-paper]">{mode === "full" ? "Full issue brief" : "Executive brief"}</span>
              </div>
            </article>
          )}
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard
              title="Brief"
              tone="info"
              meta={
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Mode</span>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{mode === "full" ? "Full" : "Executive"}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Stored revision</span>
                    <span className="text-right text-[--metis-paper]">{storedBriefRevisionLabel ?? "No stored brief yet"}</span>
                  </div>
                  {briefVersion ? (
                    <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2">
                      <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Sync</span>
                      <span
                        className={
                          briefInSync
                            ? "rounded-full border border-[--metis-status-neutral-border] bg-[--metis-status-neutral-bg] px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-neutral-fg]"
                            : "rounded-full border border-[--metis-status-info-border] bg-[--metis-status-info-bg] px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-status-info-fg]"
                        }
                      >
                        {briefInSync ? "Up to date" : "Stale"}
                      </span>
                    </div>
                  ) : null}
                  {briefSyncHint ? (
                    <p className="border-t border-white/8 pt-2 text-sm leading-6 text-[--metis-paper-muted]">{briefSyncHint}</p>
                  ) : null}
                  <p className="border-t border-white/8 pt-2 text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                    <span className="text-[--metis-paper]">Stored revision</span> is the numbered brief on file.{" "}
                    <span className="text-[--metis-paper]">Up to date / Stale</span> only reflects whether the issue record changed after that revision was
                    generated — not a different version number.
                  </p>
                </div>
              }
            >
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                {artifactMetadata.length ? (
                  artifactMetadata.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 border-t border-white/8 pt-2 first:border-t-0 first:pt-0">
                      <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">{item.label}</span>
                      <span className="text-[--metis-paper]">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p>No stored brief for this mode yet.</p>
                )}
              </div>
            </ReviewRailCard>

            {mode === "executive" && artifact?.executive?.immediateActions?.length ? (
              <CollapsibleSection
                defaultOpen={false}
                summary={
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">Pre-flight checks</h3>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{artifact.executive.immediateActions.length}</Badge>
                  </div>
                }
              >
                <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-[--metis-paper-muted]">
                  {artifact.executive.immediateActions.map((line, i) => (
                    <li key={`${i}-${line.slice(0, 32)}`}>{line}</li>
                  ))}
                </ul>
              </CollapsibleSection>
            ) : null}

            {mode === "full" && linkedSources.length ? (
              <CollapsibleSection
                defaultOpen={false}
                summary={
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.72)]">Sources appendix</h3>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{linkedSources.length}</Badge>
                  </div>
                }
              >
                <div className="space-y-3">
                  {linkedSources.map((s) => (
                    <div key={s.id} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[--metis-paper]">{s.sourceCode} · {s.title}</p>
                          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                            {s.tier} · {s.linkedSection ?? "—"}
                          </p>
                        </div>
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{s.reliability ?? "In use"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            ) : null}

            <ReviewRailCard
              title="Status"
              tone="info"
              meta={
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Status</span>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issue.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2">
                    <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">Open questions</span>
                    <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">{issue.openGapsCount}</Badge>
                  </div>
                </div>
              }
            >
              <div className="space-y-2 text-sm leading-6 text-[--metis-paper-muted]">
                {changeSummary.map((item) => (
                  <div key={item} className="grid grid-cols-[10px_minmax(0,1fr)] gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[--metis-outline-strong]" aria-hidden />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </ReviewRailCard>

            <ReviewRailCard
              title="Blockers"
              meta={
                <div className="flex items-center gap-2 text-[--metis-text-primary]">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400/85" aria-hidden />
                  <span>Top items to validate</span>
                </div>
              }
            >
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
            </ReviewRailCard>

            <ReviewRailCard
              title="Evidence"
              tone="info"
              meta={
                <div className="flex items-center gap-2 text-[--metis-text-primary]">
                  <Library className="h-4 w-4 text-[--metis-text-secondary]" aria-hidden />
                  <span>{linkedSources.length ? `${linkedSources.length} linked sources` : "No linked sources yet"}</span>
                </div>
              }
            >
              <div className="space-y-3">
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
            </ReviewRailCard>

            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issue.id}/sources`}>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Open sources
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
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

