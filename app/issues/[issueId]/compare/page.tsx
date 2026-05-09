import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, FileOutput, RefreshCcw, ScanSearch, TrendingUp } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell, ReadinessPill, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { BriefModeSchema, BriefArtifactSchema, type BriefMode, type BriefArtifact } from "@metis/shared/briefVersion";
import type { CompareGroupId, CompareSummary, CirculationState } from "@metis/shared/compare";
import { compareBriefArtifacts } from "@/lib/brief/compareBriefVersions";
import { resolveCompareVersionPair } from "@/lib/brief/resolveCompareVersions";
import { CompareVersionSelectors } from "@/app/issues/[issueId]/compare/compare-version-selector.client";

export const dynamic = "force-dynamic";

function groupTitle(mode: BriefMode, id: CompareGroupId) {
  if (mode === "executive") {
    if (id === "new_facts") return "Executive summary";
    if (id === "changed_assumptions") return "Other executive sections";
    if (id === "resolved_uncertainties") return "Resolved uncertainties";
    return "Immediate actions";
  }
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

function snapshotLabel(iso: Date) {
  return `Generated from issue update · ${iso.toLocaleString()}`;
}

const EXEC_PREVIEW_LABEL = "Executive summary";

/** Side-by-side preview lines: Full uses stored executive-summary section body; Executive uses the executive-summary block shown in Exec brief UI. */
function summarizeArtifactPreview(artifact: BriefArtifact, mode: BriefMode) {
  let primary =
    artifact.full.sections.find((s) => s.id === "executive-summary")?.body ?? artifact.lede;
  if (mode === "executive") {
    const block = artifact.executive.blocks.find((b) => b.label === EXEC_PREVIEW_LABEL);
    if (block?.body?.trim()) primary = block.body;
  }
  return primary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
}

/** Matches visible preview lines after trim + whitespace collapse per line (then joined); used only for excerpt equality, not the diff engine. */
function normalizePreviewExcerptSlices(lines: string[]): string {
  return lines.map((line) => line.trim().replace(/\s+/g, " ").trim()).join("\n");
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
  const fromRaw = typeof sp.from === "string" ? sp.from : Array.isArray(sp.from) ? sp.from[0] : undefined;
  const toRaw = typeof sp.to === "string" ? sp.to : Array.isArray(sp.to) ? sp.to[0] : undefined;

  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const allVersions = await prisma.briefVersion.findMany({
    where: { issueId: issue.id, mode },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      versionNumber: true,
      createdAt: true,
      generatedFromIssueUpdatedAt: true,
      circulationNotes: true,
      artifact: true,
    },
  });

  // 0 versions: show empty state.
  if (allVersions.length === 0) {
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

  const pair = resolveCompareVersionPair(
    allVersions.map((v) => ({ id: v.id, versionNumber: v.versionNumber, createdAt: v.createdAt })),
    fromRaw,
    toRaw,
  );
  const versionById = new Map(allVersions.map((v) => [v.id, v]));
  const toRow = pair.to ? versionById.get(pair.to.id)! : allVersions[0]!;
  const fromRow = pair.from ? versionById.get(pair.from.id) ?? null : null;

  const toArtifact = BriefArtifactSchema.parse(toRow.artifact) as BriefArtifact;
  const toSummary = summarizeArtifactPreview(toArtifact, mode);

  let compare: { summary: CompareSummary; changeCount: number };
  let fromArtifact: BriefArtifact | null = null;
  let fromSummary: string[] = [];

  if (!fromRow) {
    compare = { summary: compareBriefArtifacts(toArtifact, toArtifact, mode), changeCount: 0 };
  } else {
    fromArtifact = BriefArtifactSchema.parse(fromRow.artifact) as BriefArtifact;
    fromSummary = summarizeArtifactPreview(fromArtifact, mode);

    const summary = compareBriefArtifacts(fromArtifact, toArtifact, mode);
    const changeCount = summary.groups.reduce((acc, g) => acc + g.items.length, 0);
    compare = { summary, changeCount };
  }

  const deltaGroups = compare.summary.groups.map((g) => ({
    id: g.id,
    title: groupTitle(mode, g.id),
    state: groupState(g.id),
    items: g.items,
  }));

  const groupsWithItems = deltaGroups.filter((g) => g.items.length > 0);
  const groupsWithoutItems = deltaGroups.filter((g) => !g.items.length);
  const hasFrom = Boolean(fromRow);
  const previewExcerptUnchanged =
    hasFrom && normalizePreviewExcerptSlices(fromSummary) === normalizePreviewExcerptSlices(toSummary);
  const changedPreviewGroupTitles = groupsWithItems.map((g) => g.title);
  const showOpeningPreviewUnchangedExplain =
    hasFrom && !pair.sameVersionSelected && compare.changeCount > 0 && previewExcerptUnchanged;
  const modeComparisonTitle = mode === "full" ? "Full brief comparison" : "Executive brief comparison";
  const modeGeneratePhrase = mode === "full" ? "full" : "executive";

  const readinessMovement = compare.summary.readinessMovement ?? [];

  const versionPickerRows = allVersions.map((v) => ({
    id: v.id,
    primaryLabel: versionLabel(v),
    secondaryLabel: snapshotLabel(v.generatedFromIssueUpdatedAt),
  }));

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
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <SurfaceCard className="min-w-0 overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium text-[--metis-paper]">{modeComparisonTitle}</p>
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(176,171,160,0.62)]">
                  {fromRow ? `${versionLabel(fromRow)} → ${versionLabel(toRow)}` : versionLabel(toRow)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {hasFrom && !pair.sameVersionSelected && compare.changeCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(112,191,232,0.48)] bg-[rgba(19,86,118,0.6)] px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-sky-50 ring-1 ring-[rgba(138,214,250,0.2)] shadow-[0_10px_24px_rgba(14,48,73,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    {compare.changeCount} {compare.changeCount === 1 ? "change" : "changes"} detected
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-b border-white/8 px-6 py-5 sm:px-7">
            <CompareVersionSelectors
              issueId={issue.id}
              mode={mode}
              versionsNewestFirst={versionPickerRows}
              selectedFromId={fromRow?.id ?? null}
              selectedToId={toRow.id}
            />
          </div>

          <article className="min-w-0 space-y-8 px-7 py-8 sm:px-8">
            {pair.selectionCoercion === "invalid_params_ignored" ? (
              <div className="rounded-[1.1rem] border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_38%,transparent)] px-5 py-4 text-sm leading-relaxed text-[--metis-status-warning-fg]">
                <p className="font-medium text-[--metis-text-primary]">Version selection adjusted</p>
                <p className="mt-2 text-[--metis-text-secondary]">
                  One or both version IDs in the URL were missing or invalid for this issue and mode; Metis defaulted to a valid pair below.
                </p>
              </div>
            ) : null}

            {pair.sameVersionSelected ? (
              <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_82%,transparent)] px-5 py-4 text-sm leading-relaxed text-[--metis-text-secondary]">
                <p className="font-medium text-[--metis-text-primary]">Same revision selected twice</p>
                <p className="mt-2">
                  Select two different versions for a meaningful delta — there is none when “From” and “To” match. Excerpts below are identical; choose another pair (
                  <Link href={`/issues/${issue.id}/compare?mode=${mode}`} className="font-medium text-[--metis-brass-soft] underline underline-offset-[0.2em] hover:text-[--metis-text-primary]">
                    reset to defaults
                  </Link>
                  ).
                </p>
              </div>
            ) : null}

            {!hasFrom ? (
              <div className="rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm leading-relaxed text-[--metis-paper-muted]">
                <p className="font-medium text-[--metis-paper]">No prior version yet</p>
                <p className="mt-2">
                  Generate another <span className="text-[--metis-paper]">{modeGeneratePhrase}</span> brief to compare changes.
                </p>
              </div>
            ) : !pair.sameVersionSelected && compare.changeCount === 0 ? (
              <div className="rounded-[1.1rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm leading-relaxed text-[--metis-paper-muted]">
                <p className="font-medium text-[--metis-paper]">No material text changes detected</p>
                <p className="mt-2">
                  These revisions may still differ in metadata or generation time, but{" "}
                  <span className="text-[--metis-paper]">no new compared lines</span> were found{" "}
                  {mode === "executive"
                    ? "among executive brief blocks and immediate actions."
                    : "in these full brief excerpt sections."}
                </p>
              </div>
            ) : null}

            <p className="text-xs leading-relaxed text-[--metis-ink-soft]">
              {mode === "executive" ? (
                <>
                  Compared executive text includes the labeled blocks shown on the Executive brief plus immediate actions. Linked sources, tracker records, alternate
                  wording storage, export appendices, and full-only sections are not fully compared yet.
                </>
              ) : (
                <>
                  Compared text excerpts the full brief artifact: executive summary, current position / open questions, and recommended actions. Sources, tracker
                  records, observations, alternate wording hooks, and export appendices are not fully compared yet.
                </>
              )}
            </p>

            {pair.sameVersionSelected ? null : showOpeningPreviewUnchangedExplain ? (
              <div className="min-w-0 rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_70%,var(--metis-surface-page))] px-5 py-4 text-sm leading-relaxed text-[--metis-text-secondary] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]">
                <p className="font-medium text-[--metis-text-primary]">Opening preview unchanged</p>
                <p className="mt-2">
                  The visible preview excerpt is the same; the detected {compare.changeCount === 1 ? "change is" : "changes are"} in the compared sections below.
                </p>
                {changedPreviewGroupTitles.length ? (
                  <p className="mt-2 text-[--metis-text-tertiary]">
                    Changes detected below in{" "}
                    <span className="font-medium text-[--metis-text-primary]">{changedPreviewGroupTitles.join(", ")}</span>.
                  </p>
                ) : null}
                <p className="mt-3">
                  <a
                    href="#compare-changes"
                    className="text-[0.8125rem] font-medium text-[--metis-brass-soft] underline underline-offset-[0.22em] transition hover:text-[--metis-text-primary]"
                  >
                    Jump to changes
                  </a>
                </p>
              </div>
            ) : null}

            {!pair.sameVersionSelected && hasFrom && previewExcerptUnchanged ? (
              showOpeningPreviewUnchangedExplain ? null : (
                <p className="text-[0.72rem] leading-relaxed text-[--metis-ink-soft]">Preview excerpt unchanged</p>
              )
            ) : null}

            <section className="grid min-w-0 gap-5 xl:grid-cols-2">
              <div className="metis-surface metis-support-surface rounded-[1.35rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">From</p>
                <div className="mt-4 space-y-3">
                  {fromRow ? (
                    fromSummary.map((item, idx) => (
                      <div
                        key={`from-${idx}`}
                        className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper-muted]"
                      >
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                        <p className="min-w-0 break-words">{item}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-[--metis-paper-muted]">No “From” revision — generate another brief to compare.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-[rgba(224,183,111,0.22)] bg-[linear-gradient(180deg,rgba(224,183,111,0.12),rgba(255,255,255,0.04))] px-5 py-5 shadow-[0_18px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">To</p>
                <div className="mt-4 space-y-3">
                  {toSummary.map((item, idx) => (
                    <div
                      key={`to-${idx}`}
                      className="grid min-w-0 grid-cols-[14px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper]"
                    >
                      <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[--metis-brass]" />
                      <p className="min-w-0 break-words">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {hasFrom && !pair.sameVersionSelected ? (
              <section id="compare-changes" className="scroll-mt-24 space-y-4 border-t border-white/8 pt-8">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <h3 className="font-[Cormorant_Garamond] min-w-0 text-[2rem] leading-none text-[--metis-paper]">
                    {mode === "executive" ? "Compared executive text" : "Compared full brief text"}
                  </h3>
                </div>

                {compare.changeCount > 0 ? (
                  <div className="space-y-4">
                    {groupsWithItems.map((group) => (
                      <section
                        key={group.id}
                        className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-lg font-medium text-[--metis-paper]">{group.title}</h4>
                          <ReadinessPill state={group.state} />
                        </div>
                        <div className="mt-4 space-y-3">
                          {group.items.map((item, idx) => (
                            <div
                              key={`${group.id}-${idx}`}
                              className="grid min-w-0 grid-cols-[16px_minmax(0,1fr)] gap-3 text-sm leading-7 text-[--metis-paper]"
                            >
                              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[--metis-brass]" />
                              <p className="min-w-0 break-words">{item}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                    {groupsWithoutItems.length ? (
                      <p className="text-[0.7rem] leading-relaxed text-[--metis-ink-soft] opacity-90">
                        No compared text changes in{" "}
                        {groupsWithoutItems.map((g) => g.title).join("; ")}.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-[--metis-ink-soft]">
                    No entries in tracked change categories for this comparison (see banner above).
                  </p>
                )}
              </section>
            ) : null}
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
                  <p>{toRow.circulationNotes ?? "Internal review open."}</p>
                  <p>Wider circulation held.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issue.id}/export?mode=${mode}`}>
                  <FileOutput className="mr-2 h-4 w-4" />
                  Open export
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issue.id}/brief?mode=${mode}`}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Open brief
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
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

