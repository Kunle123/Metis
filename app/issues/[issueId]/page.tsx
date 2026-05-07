import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";

import { SourceEntryForm } from "./sources/source-entry-form";
import { GapCreateForm } from "./gaps/gap-create-form";
import { CaptureNotesForm } from "./input/capture-notes-form";
import { InternalInputCreateForm } from "./input/input-create-form";
import { WorkspaceGapCards, WorkspaceSourceCards, WorkspaceObservationCards } from "./workspace-cards";
import { WorkspaceSection } from "./workspace-section";

export const dynamic = "force-dynamic";

function sectionNavItem(id: string, label: string) {
  return (
    <a
      key={id}
      href={`#${id}`}
      className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-3.5 py-2 text-sm text-[--metis-paper-muted] transition hover:border-[--metis-outline-strong] hover:bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_62%,transparent)] hover:text-[--metis-paper]"
    >
      {label}
    </a>
  );
}

export default async function IssueWorkspacePage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) {
    return (
      <MetisShell activePath="/workspace" pageTitle="Issue workspace" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const [sources, gaps, inputs] = await Promise.all([
    prisma.source.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
  ]);

  const captureNotesAiEnabled = process.env.NOTES_CAPTURE_AI_ENABLED?.trim() === "true";

  return (
    <MetisShell
      activePath="/workspace"
      pageTitle="Issue workspace"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <div className="space-y-6">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between lg:items-end">
              <div className="min-w-0 space-y-1">
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Workspace</h2>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Review the issue record, sources, open questions, and input in one screen.
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 md:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                    {issue.issueType}
                  </Badge>
                  <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">{issue.severity}</Badge>
                  <Link
                    href={`/issues/${issue.id}/sources`}
                    className="inline-flex items-center rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-3 py-1 text-[0.72rem] font-medium text-[--metis-text-secondary] transition hover:border-[--metis-outline-strong] hover:bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_68%,transparent)] hover:text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/50"
                  >
                    Sources · {issue.sourcesCount}
                  </Link>
                  <Link
                    href={`/issues/${issue.id}/gaps`}
                    className="inline-flex items-center rounded-full border border-[--metis-status-warning-border] bg-[--metis-status-warning-bg] px-3 py-1 text-[0.72rem] font-medium text-[--metis-status-warning-fg] transition hover:bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_88%,var(--metis-surface-page))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/45"
                  >
                    Open questions · {issue.openGapsCount}
                  </Link>
                </div>
                <p className="max-w-[17rem] text-[0.68rem] leading-snug text-[--metis-paper-muted] md:text-right">
                  Review evidence in Sources or close questions in Open questions.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {[
                ["summary", "Issue summary"],
                ["facts", "Confirmed vs unclear"],
                ["sources", "Sources"],
                ["gaps", "Open questions"],
                ["capture-notes", "Capture notes"],
                ["input", "Observations"],
              ].map(([id, label]) => sectionNavItem(id, label))}
            </div>
          </div>

          <div className="space-y-8 px-6 py-6 sm:px-7 sm:py-7">
            <section id="summary" className="space-y-4">
              <div className="rounded-[1.35rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_82%,transparent)] px-5 py-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_18%,transparent)]">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-text-tertiary]">Issue summary (read-only)</p>
                <h3 className="mt-2 text-[1.35rem] font-medium leading-8 text-[--metis-paper]">{issue.title}</h3>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.summary}</p>
              </div>
            </section>

            <section id="facts" className="space-y-5 border-t border-[--metis-outline-subtle] pt-8">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-text-tertiary]">Confirmed vs unclear (read-only)</p>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">Keep facts and unknowns separate.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Confirmed facts</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.confirmedFacts ?? "—"}</p>
                </div>
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_40%,transparent)] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Open questions</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.openQuestions ?? "—"}</p>
                </div>
              </div>
              {issue.context ? (
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border]/90 bg-[--metis-info-bg] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Context</p>
                  <p className="text-sm leading-7 text-[--metis-paper-muted] whitespace-pre-wrap">{issue.context}</p>
                </div>
              ) : null}
            </section>

            <section id="sources" className="space-y-5 border-t border-[--metis-outline-subtle] pt-8">
              <WorkspaceSection
                title="Sources"
                description="Evidence and artifacts linked to this issue. Creates a saved source record on the issue."
                addLabel="Add source"
                advancedHref={`/issues/${issue.id}/sources`}
                form={<SourceEntryForm issueId={issue.id} />}
              >
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Saved sources (preview)</p>
                {sources.length ? (
                  <WorkspaceSourceCards
                    issueId={issue.id}
                    sources={sources.slice(0, 8).map((s) => ({
                      id: s.id,
                      title: s.title,
                      note: s.note,
                      snippet: s.snippet,
                      url: s.url,
                      tier: s.tier,
                      section: s.linkedSection ?? null,
                      reliability: s.reliability ?? null,
                      observedAt: null,
                      createdAt: s.createdAt.toISOString(),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No sources yet.</p>
                )}
              </WorkspaceSection>
            </section>

            <section id="gaps" className="space-y-5 border-t border-[--metis-outline-subtle] pt-7">
              <WorkspaceSection
                title="Open questions"
                description="Unknowns and questions that must be answered. Creates a saved open-question record on the issue."
                addLabel="Add open question"
                advancedHref={`/issues/${issue.id}/gaps`}
                form={<GapCreateForm issueId={issue.id} />}
              >
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Saved open questions (preview)</p>
                {gaps.length ? (
                  <WorkspaceGapCards
                    issueId={issue.id}
                    gaps={gaps.slice(0, 8).map((g) => ({
                      id: g.id,
                      prompt: g.prompt,
                      whyItMatters: g.whyItMatters ?? null,
                      status: g.status ?? null,
                      severity: g.severity ?? null,
                      stakeholder: g.stakeholder ?? null,
                      section: g.linkedSection ?? null,
                      resolvedByInternalInputId: g.resolvedByInternalInputId ?? null,
                      createdAt: g.createdAt.toISOString(),
                    }))}
                    internalInputs={inputs.slice(0, 50).map((i) => ({
                      id: i.id,
                      role: i.role,
                      name: i.name,
                      createdAt: i.createdAt.toISOString(),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No open questions yet.</p>
                )}
              </WorkspaceSection>
            </section>

            <section id="input" className="space-y-8 border-t border-[--metis-outline-subtle] pt-8">
              <CaptureNotesForm issueId={issue.id} captureNotesAiEnabled={captureNotesAiEnabled} />
              <WorkspaceSection
                title="Observations"
                description="Attributable internal observations linked to sections. Creates a saved observation record on the issue."
                addLabel="Add observation"
                advancedHref={`/issues/${issue.id}/input`}
                form={<InternalInputCreateForm issueId={issue.id} />}
              >
                <p className="rounded-xl border border-[--metis-info-border]/60 bg-[color-mix(in_oklab,var(--metis-info-bg)_48%,transparent)] px-3 py-2.5 text-sm leading-6 text-[--metis-paper-muted]">
                  Observations are attributable internal statements. Sources are external or internal artifacts used as evidence.
                </p>
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Saved observations (preview)</p>
                {inputs.length ? (
                  <WorkspaceObservationCards
                    issueId={issue.id}
                    observations={inputs.slice(0, 6).map((i) => ({
                      id: i.id,
                      role: i.role,
                      name: i.name,
                      response: i.response,
                      confidence: i.confidence,
                      linkedSection: i.linkedSection ?? null,
                      timestampLabel: i.timestampLabel ?? null,
                      visibility: i.visibility ?? null,
                      excludedFromBrief: (i as any).excludedFromBrief ?? false,
                      createdAt: i.createdAt.toISOString(),
                    }))}
                  />
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No observations yet.</p>
                )}
              </WorkspaceSection>

              <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_35%,transparent)] px-5 py-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Continue when ready</p>
                <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                  Optional next steps — generate outputs after you’ve captured notes, reviewed suggestions, and saved records.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/issues/${issue.id}/brief`} className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-4 py-2 text-sm text-[--metis-paper] hover:underline underline-offset-4">
                    Brief →
                  </Link>
                  <Link href={`/issues/${issue.id}/messages`} className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-4 py-2 text-sm text-[--metis-paper] hover:underline underline-offset-4">
                    Messages →
                  </Link>
                  <Link href={`/issues/${issue.id}/comms-plan`} className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-4 py-2 text-sm text-[--metis-paper] hover:underline underline-offset-4">
                    Comms plan →
                  </Link>
                  <Link href={`/issues/${issue.id}/export`} className="rounded-full border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_52%,transparent)] px-4 py-2 text-sm text-[--metis-paper] hover:underline underline-offset-4">
                    Export →
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

