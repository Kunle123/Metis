import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, ExternalLink, Link2, ShieldCheck } from "lucide-react";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import type { SourceTier } from "@metis/shared/source";
import { SourceEntryForm } from "./source-entry-form";
import { CollapsibleFormPanel } from "@/app/issues/[issueId]/collapsible-form-panel";

export const dynamic = "force-dynamic";

const tierOrder = ["Official", "Internal", "Major media", "Market signal"] as const;

const tierTone: Record<(typeof tierOrder)[number], string> = {
  Official: "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50",
  Internal: "border-0 bg-[rgba(118,84,26,0.5)] text-[rgba(255,237,202,0.98)]",
  "Major media": "border-0 bg-[rgba(20,84,118,0.54)] text-sky-50",
  "Market signal": "border border-white/12 bg-[rgba(52,69,91,0.52)] text-slate-100",
};

function compareTier(a: string, b: string) {
  const ai = tierOrder.indexOf(a as (typeof tierOrder)[number]);
  const bi = tierOrder.indexOf(b as (typeof tierOrder)[number]);
  return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
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
  const issue = await getIssueById(issueId);

  if (!issue) {
    return (
      <MetisShell activePath="/sources" pageTitle="Sources" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

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

  return (
    <MetisShell
      activePath="/sources"
      pageTitle="Sources"
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
            <ReviewToolbar
              className="border-0 bg-transparent px-0 py-0"
              left={
                <div className="space-y-1">
                  <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Evidence library</h2>
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                    Full list of sources for this issue. Add new evidence when needed; day-to-day work stays in the workspace.
                  </p>
                </div>
              }
              right={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {tierCounts.map((item) => (
                    <Badge key={item.tier} className={tierTone[item.tier]}>
                      {item.tier}: {item.count}
                    </Badge>
                  ))}
                </div>
              }
            >
              <div className="flex flex-wrap items-center gap-2 lg:justify-center">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
                >
                  <Link href={`/issues/${issue.id}`}>Back to workspace</Link>
                </Button>
              </div>
            </ReviewToolbar>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
            <div className="rounded-[1.25rem] border border-[--metis-info-border] bg-[rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {sources.map((item) => {
                const usageLabel = item.tier === "Major media" || item.tier === "Market signal" ? "Signal" : "In brief";
                const tier = item.tier as SourceTier;
                const timestampLabel = item.timestampLabel ?? "—";
                const title = (item.title ?? "").trim() || "Source";
                const note = (item.note ?? "").trim();
                const snippet = (item.snippet ?? "").trim();
                const hasDetails = Boolean(note || snippet);
                const detailsPreview = clampText(note || snippet, 220);

                return (
                  <div key={item.id} className="border-t border-white/10 px-4 py-3 first:border-t-0 sm:px-5">
                    <DenseSection
                      title={
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{item.sourceCode}</Badge>
                          <Badge className={tierTone[tier]}>{tier}</Badge>
                          <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{timestampLabel}</Badge>
                        </div>
                      }
                      className="space-y-2 border-t-0 pt-0"
                      titleClassName="text-[0.62rem]"
                    >
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[--metis-paper] sm:text-[0.95rem]">{title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[--metis-paper-muted]">
                            <span className="inline-flex items-center gap-1.5 text-[--metis-paper]">
                              <Link2 className="h-3.5 w-3.5 text-[--metis-brass]" />
                              {item.linkedSection ?? "—"}
                            </span>
                            <span className="text-white/20">•</span>
                            <span>{item.reliability ?? "—"}</span>
                            <span className="text-white/20">•</span>
                            <span>{usageLabel}</span>
                          </div>
                          {hasDetails ? (
                            <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{detailsPreview}</p>
                          ) : (
                            <p className="mt-2 text-sm leading-6 text-white/40">No note or snippet recorded.</p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {item.url ? (
                            <a
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open link
                            </a>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                              No link
                            </span>
                          )}
                        </div>
                      </div>

                      {hasDetails ? (
                        <div className="pt-1">
                          <CollapsibleSection
                            defaultOpen={false}
                            className="border-[--metis-info-border] bg-[--metis-info-bg] px-4 py-3"
                            summary={
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                                    Note / snippet
                                  </p>
                                  <p className="mt-1 text-xs text-[--metis-paper-muted]">
                                    Expand to view full text.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-white/45">
                                  <span className="text-xs">Toggle</span>
                                  <ChevronRight className="h-4 w-4" />
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>
                            }
                          >
                            <div className="space-y-3">
                              {note ? (
                                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                  <p className="text-xs text-white/50">Note</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{note}</p>
                                </div>
                              ) : null}
                              {snippet ? (
                                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                  <p className="text-xs text-white/50">Snippet</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">“{snippet}”</p>
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

            <div className="pt-2">
              <CollapsibleFormPanel
                title="Add source"
                description="Capture evidence and artifacts for the issue. Sources should be reviewable items, not questions."
                addLabel="Add source"
                form={<SourceEntryForm issueId={issue.id} />}
                secondaryAction={
                  <Button asChild variant="outline" className="h-10 rounded-full px-4">
                    <Link href={`/issues/${issue.id}`}>Workspace</Link>
                  </Button>
                }
              >
                <div />
              </CollapsibleFormPanel>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface">
          <div className="space-y-4 px-5 py-5">
            <ReviewRailCard
              title="Review posture"
              tone="info"
              meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Quick status signals for the brief sections.</p>}
            >
              <div className="space-y-3">
                {sectionPosture.map((item) => (
                  <div key={item.title} className="border-t border-white/8 pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                        <p className="mt-1 text-sm leading-5 text-[--metis-paper-muted]">{item.detail}</p>
                      </div>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{item.badge}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewRailCard>

            <ReviewRailCard
              title="Conflicts"
              tone="info"
              meta={
                <div className="flex items-center gap-2 text-[--metis-paper]">
                  <ShieldCheck className="h-4 w-4 text-[--metis-brass]" />
                  <p className="text-sm leading-6 text-[--metis-paper-muted]">2 open conflicts</p>
                </div>
              }
            >
              <div />
            </ReviewRailCard>

            <ReviewRailCard title="Next" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Jump to the full brief for output prep.</p>}>
              <div className="grid gap-3">
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href={`/issues/${issue.id}/brief?mode=full`}>
                    Open brief
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </ReviewRailCard>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

