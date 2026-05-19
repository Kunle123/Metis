import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ChevronDown, ChevronRight, ExternalLink, Link2, ShieldCheck } from "lucide-react";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { prisma } from "@/lib/db/prisma";
import { ISSUE_RECORD_ACTIVE_PATH } from "@/lib/issues/issueNav";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import type { SourceTier } from "@metis/shared/source";
import { SourceEntryForm } from "./source-entry-form";
import { CollapsibleFormPanel } from "@/app/issues/[issueId]/collapsible-form-panel";

export const dynamic = "force-dynamic";

const tierOrder = ["Official", "Internal", "Major media", "Market signal"] as const;

/** Tier chips: token-backed for light/dark; semantic hues without implying brief inclusion. */
const tierBadgeClass: Record<(typeof tierOrder)[number], string> = {
  Official:
    "border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_48%,transparent)] text-[--metis-status-success-fg]",
  Internal:
    "border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_58%,transparent)] text-[--metis-text-secondary]",
  "Major media":
    "border border-[--metis-status-info-border] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_52%,transparent)] text-[--metis-status-info-fg]",
  "Market signal":
    "border border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_72%,transparent)] text-[--metis-status-neutral-fg]",
};

function compareTier(a: string, b: string) {
  const ai = tierOrder.indexOf(a as (typeof tierOrder)[number]);
  const bi = tierOrder.indexOf(b as (typeof tierOrder)[number]);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
}

function tierBasedHint(tier: SourceTier): string {
  if (tier === "Major media" || tier === "Market signal") {
    return "Tier-based hint: external/signal material — corroborate before relying on it in narrative.";
  }
  return "Tier-based hint: typical anchor material for internal review (not automatic brief inclusion).";
}

const sectionPosture = [
  {
    title: "Executive Summary",
    badge: "Ready for review",
    detail: "Internal",
  },
  {
    title: "Confirmed vs Unclear",
    badge: "Needs validation",
    detail: "Exposure wording open",
  },
  {
    title: "Narrative Map",
    badge: "Source conflict",
    detail: "External line ahead of confirmed fact",
  },
] as const;

function clampText(s: string, max = 220) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export default async function IssueSourcesPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const pageCtx = await loadIssuePageContext(issueId);
  if (pageCtx.outcome === "unauthorized") redirect("/login");
  if (pageCtx.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (pageCtx.outcome === "not_found") notFound();
  const { issue } = pageCtx;

  const sources = await prisma.source.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
  });

  sources.sort((a, b) => {
    const byTier = compareTier(a.tier, b.tier);
    if (byTier !== 0) return byTier;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const tierCounts = tierOrder.map((tier) => ({
    tier,
    count: sources.filter((s) => s.tier === tier).length,
  }));

  const missingReliabilityCount = sources.filter((s) => !(s.reliability ?? "").trim()).length;
  const missingBriefSectionCount = sources.filter((s) => !(s.linkedSection ?? "").trim()).length;

  return (
    <MetisShell
      activePath={ISSUE_RECORD_ACTIVE_PATH}
      pageMeta="Record view"
      pageTitle="Sources"
      organisationMembershipRole={pageCtx.context.membership.role}
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
          <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div className="space-y-1">
                  <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Evidence library</h2>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    Full list of sources for this issue. Add or review evidence here before treating brief claims as settled; day-to-day work can
                    stay in the workspace until you need the full ledger.
                  </p>
                  <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                    Questions that still block confirmation belong on{" "}
                    <Link href={`/issues/${issue.id}/gaps`} className="text-[--metis-brass-soft] underline-offset-4 hover:underline">
                      Open questions
                    </Link>
                    .
                  </p>
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                <Button asChild variant="outline" className="justify-start">
                  <Link href={`/issues/${issue.id}`}>Back to workspace</Link>
                </Button>
              </div>
            </ReviewToolbar>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            {/* 1. Evidence overview */}
            <section aria-label="Evidence overview" className="space-y-2">
              <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)]">
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Evidence overview</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_55%,transparent)] px-2.5 py-0.5 text-[0.72rem] text-[--metis-text-secondary]">
                    Total · {sources.length}
                  </span>
                  {tierCounts.map((item) => (
                    <Badge key={item.tier} className={tierBadgeClass[item.tier]}>
                      {item.tier}: {item.count}
                    </Badge>
                  ))}
                </div>
                {sources.length > 0 ? (
                  <p className="mt-2 text-xs leading-relaxed text-[--metis-text-tertiary]">
                    Incomplete metadata:{" "}
                    <span className="text-[--metis-text-secondary]">
                      {missingReliabilityCount} without Reliability · {missingBriefSectionCount} without Brief section
                    </span>
                  </p>
                ) : null}
              </div>
            </section>

            {/* 2. Add source */}
            <section id="add-source" className="scroll-mt-24 space-y-2" aria-label="Add source">
              <CollapsibleFormPanel
                title="Add source"
                description="Creates a saved source record on this issue. This does not insert text directly into generated brief output — the brief consumes evidence when you build it separately. Capture reviewable artifacts, not open questions."
                addLabel="Add source"
                form={<SourceEntryForm issueId={issue.id} />}
                secondaryAction={
                  <Button asChild variant="outline">
                    <Link href={`/issues/${issue.id}`}>Workspace</Link>
                  </Button>
                }
              >
                <div />
              </CollapsibleFormPanel>
            </section>

            {/* 3. Saved sources register */}
            <section aria-label="Saved sources" className="space-y-3">
              <div>
                <h3 className="font-[Cormorant_Garamond] text-xl leading-snug text-[--metis-paper]">Saved sources ({sources.length})</h3>
                {sources.length > 0 ? (
                  <p className="mt-1 text-xs leading-relaxed text-[--metis-paper-muted]">
                    Ordered by source type (strongest first), then newest within each type. Each row is already persisted on this issue.
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-relaxed text-[--metis-paper-muted]">No saved sources yet — use Add source above.</p>
                )}
              </div>

              {sources.length === 0 ? (
                <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_70%,transparent)] px-5 py-6 sm:px-6 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
                  <p className="text-sm font-medium text-[--metis-paper]">No sources saved yet</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[--metis-paper-muted]">
                    Add evidence so briefs and exports can point to reviewable material. Start with official or internal artifacts, then layer media or
                    market signals as needed.
                  </p>
                  <Button asChild className="mt-4 w-fit">
                    <Link href="#add-source">Jump to Add source</Link>
                  </Button>
                </div>
              ) : (
                <div className="rounded-[1.25rem] border border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-info-bg)_35%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
                  {sources.map((item) => {
                    const tier = item.tier as SourceTier;
                    const timestampLabel = item.timestampLabel ?? "—";
                    const title = (item.title ?? "").trim() || "Source";
                    const note = (item.note ?? "").trim();
                    const snippet = (item.snippet ?? "").trim();
                    const hasDetails = Boolean(note || snippet);
                    const detailsPreview = clampText(note || snippet, 220);
                    const briefSectionDisplay = (item.linkedSection ?? "").trim() || "—";
                    const reliabilityDisplay = (item.reliability ?? "").trim() || "—";

                    return (
                      <div key={item.id} className="border-t border-[--metis-outline-subtle] px-4 py-3 first:border-t-0 sm:px-5">
                        <DenseSection
                          title={
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[0.62rem] text-[--metis-text-tertiary]">Provenance</span>
                              <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                                {item.sourceCode}
                              </Badge>
                              <Badge className={tierBadgeClass[tier]}>{tier}</Badge>
                              <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_55%,transparent)] text-[--metis-text-secondary]">
                                {timestampLabel}
                              </Badge>
                            </div>
                          }
                          className="space-y-2 border-t-0 pt-0"
                          titleClassName="text-[0.62rem]"
                        >
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div>
                                <p className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Evidence</p>
                                <p className="truncate text-sm font-medium text-[--metis-paper] sm:text-[0.95rem]">{title}</p>
                              </div>
                              <div className="space-y-1 text-xs text-[--metis-paper-muted]">
                                <p>
                                  <span className="text-[--metis-text-tertiary]">Brief section · </span>
                                  <span className="inline-flex items-center gap-1.5 text-[--metis-paper]">
                                    <Link2 className="h-3.5 w-3.5 shrink-0 text-[--metis-brass]" aria-hidden />
                                    {briefSectionDisplay}
                                  </span>
                                </p>
                                <p>
                                  <span className="text-[--metis-text-tertiary]">Reliability · </span>
                                  <span className="text-[--metis-paper-muted]">{reliabilityDisplay}</span>
                                </p>
                                <p className="text-[0.68rem] leading-snug text-[--metis-text-tertiary]">{tierBasedHint(tier)}</p>
                              </div>
                              {hasDetails ? (
                                <div>
                                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">Preview</p>
                                  <p className="mt-0.5 text-sm leading-6 text-[--metis-paper-muted]">{detailsPreview}</p>
                                </div>
                              ) : (
                                <p className="text-sm leading-6 text-[--metis-text-tertiary]">No note or snippet recorded.</p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {item.url ? (
                                <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
                                  <a href={item.url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open link
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-[--metis-paper-muted]">No link</span>
                              )}
                            </div>
                          </div>

                          {hasDetails ? (
                            <div className="pt-1">
                              <CollapsibleSection
                                defaultOpen={false}
                                className="border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-info-bg)_55%,transparent)] px-4 py-3"
                                summary={
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                                        Audit: full note and excerpt
                                      </p>
                                      <p className="mt-1 text-xs text-[--metis-paper-muted]">Expand for complete text retained on the record.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[--metis-text-tertiary]">
                                      <span className="text-xs">Toggle</span>
                                      <ChevronRight className="h-4 w-4" />
                                      <ChevronDown className="h-4 w-4" />
                                    </div>
                                  </div>
                                }
                              >
                                <div className="space-y-3">
                                  {note ? (
                                    <div className="rounded-xl border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)] px-3 py-2 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
                                      <p className="text-xs text-[--metis-text-tertiary]">Note</p>
                                      <p className="mt-1 whitespace-pre-wrap text-sm text-[--metis-paper]">{note}</p>
                                    </div>
                                  ) : null}
                                  {snippet ? (
                                    <div className="rounded-xl border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)] px-3 py-2 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
                                      <p className="text-xs text-[--metis-text-tertiary]">Excerpt</p>
                                      <p className="mt-1 whitespace-pre-wrap text-sm text-[--metis-paper-muted]">&ldquo;{snippet}&rdquo;</p>
                                    </div>
                                  ) : null}
                                </div>
                              </CollapsibleSection>
                            </div>
                          ) : null}
                        </DenseSection>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard title="Next" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Jump to the full brief for output prep.</p>}>
              <div className="grid gap-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/brief?mode=full`}>
                    Open brief
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}`}>Workspace</Link>
                </Button>
              </div>
            </ReviewRailCard>

            <ReviewRailCard
              title="Tighten the record"
              tone="info"
              meta={
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Thin or informal sources make “needs validation”-style warnings more likely downstream. Prefer clear tiers, notes, and links here;
                  escalate unknowns via Open questions — not guesswork.
                </p>
              }
            >
              <div className="grid gap-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/gaps`}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-[--metis-brass]" />
                    Review open questions
                  </Link>
                </Button>
              </div>
            </ReviewRailCard>

            <details className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
              <summary className="cursor-pointer list-none text-sm font-medium text-[--metis-paper] [&::-webkit-details-marker]:hidden">
                <span className="text-[--metis-text-tertiary]">Illustrative only · </span>
                briefing posture examples
                <span className="mt-1 block text-xs font-normal text-[--metis-paper-muted]">
                  Not computed from this issue&apos;s sources or brief — expand for static examples only.
                </span>
              </summary>
              <div className="mt-4 space-y-3 border-t border-[--metis-outline-subtle] pt-4">
                {sectionPosture.map((item) => (
                  <div key={item.title} className="border-t border-[--metis-outline-subtle] pt-3 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-[--metis-paper-muted]">{item.detail}</p>
                    <p className="mt-2 text-[0.68rem] leading-snug text-[--metis-ink-soft]">
                      Example label: <span className="text-[--metis-paper-muted]">{item.badge}</span>
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
