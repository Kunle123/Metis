import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";

import { SourceEntryForm } from "./sources/source-entry-form";
import { GapCreateForm } from "./gaps/gap-create-form";
import { InternalInputCreateForm } from "./input/input-create-form";
import { WorkspaceSection } from "./workspace-section";

export const dynamic = "force-dynamic";

function sectionNavItem(id: string, label: string) {
  return (
    <a
      key={id}
      href={`#${id}`}
      className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.025)] px-4 py-2.5 text-sm text-[--metis-paper-muted] transition hover:border-white/14 hover:bg-white/[0.05] hover:text-[--metis-paper]"
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
      <MetisShell activePath="/brief" pageTitle="Issue workspace" issueRoutePrefix={`/issues/${issueId}`}>
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

  return (
    <MetisShell
      activePath="/brief"
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
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Workspace</h2>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Review the issue record, sources, gaps, and input in one screen.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issue.issueType}</Badge>
                <Badge className="border-0 bg-rose-900/35 text-rose-100">{issue.severity}</Badge>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Sources · {issue.sourcesCount}</Badge>
                <Badge className="border-0 bg-[rgba(131,82,17,0.72)] text-amber-50">Open gaps · {issue.openGapsCount}</Badge>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                ["summary", "Issue summary"],
                ["facts", "Confirmed vs unclear"],
                ["sources", "Sources"],
                ["gaps", "Gaps"],
                ["input", "Input"],
              ].map(([id, label]) => sectionNavItem(id, label))}
            </div>
          </div>

          <div className="space-y-10 px-6 py-6 sm:px-7 sm:py-7">
            <section id="summary" className="space-y-4">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Issue summary</p>
                <h3 className="text-[1.35rem] font-medium leading-8 text-[--metis-paper]">{issue.title}</h3>
                <p className="max-w-4xl text-base leading-8 text-[--metis-paper] whitespace-pre-wrap">{issue.summary}</p>
              </div>
            </section>

            <section id="facts" className="space-y-6 border-t border-white/8 pt-10">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Confirmed vs unclear</p>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">Keep facts and unknowns separate.</p>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-2 rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.03)] px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Confirmed facts</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.confirmedFacts ?? "—"}</p>
                </div>
                <div className="space-y-2 rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.03)] px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Open questions</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.openQuestions ?? "—"}</p>
                </div>
              </div>
              {issue.context ? (
                <div className="space-y-2 rounded-[1.25rem] border border-white/8 bg-[rgba(0,0,0,0.18)] px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Context</p>
                  <p className="text-sm leading-7 text-[--metis-paper-muted] whitespace-pre-wrap">{issue.context}</p>
                </div>
              ) : null}
            </section>

            <section id="sources" className="space-y-6 border-t border-white/8 pt-10">
              <WorkspaceSection
                title="Sources"
                description="Evidence and artifacts linked to this issue."
                addLabel="Add source"
                advancedHref={`/issues/${issue.id}/sources`}
                form={<SourceEntryForm issueId={issue.id} />}
              >
                {sources.length ? (
                  sources.slice(0, 8).map((s) => (
                    <article key={s.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">{s.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                            {s.sourceCode} · {s.tier} · {s.linkedSection ?? "—"}
                          </p>
                          {s.note ? <p className="mt-3 text-sm leading-6 text-[--metis-paper-muted]">{s.note}</p> : null}
                        </div>
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{s.reliability ?? "—"}</Badge>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No sources yet.</p>
                )}
              </WorkspaceSection>
            </section>

            <section id="gaps" className="space-y-6 border-t border-white/8 pt-10">
              <WorkspaceSection
                title="Gaps"
                description="Unknowns and questions that must be answered."
                addLabel="Add gap"
                advancedHref={`/issues/${issue.id}/gaps`}
                form={<GapCreateForm issueId={issue.id} />}
              >
                {gaps.length ? (
                  gaps.slice(0, 8).map((g) => (
                    <article key={g.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">{g.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                            {g.severity} · {g.status} · {g.linkedSection}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">{g.prompt}</p>
                        </div>
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{g.stakeholder}</Badge>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No gaps yet.</p>
                )}
              </WorkspaceSection>
            </section>

            <section id="input" className="space-y-6 border-t border-white/8 pt-10">
              <WorkspaceSection
                title="Observations"
                description="Attributable internal observations linked to sections."
                addLabel="Add observation"
                advancedHref={`/issues/${issue.id}/input`}
                form={<InternalInputCreateForm issueId={issue.id} />}
              >
                {inputs.length ? (
                  inputs.slice(0, 6).map((i) => (
                    <article key={i.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">
                            {i.role} · {i.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                            {i.timestampLabel ?? "—"} · {i.linkedSection ?? "—"} · {i.visibility ?? "—"}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[--metis-paper-muted]">{i.response}</p>
                        </div>
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{i.confidence}</Badge>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-[--metis-paper-muted]">No observations yet.</p>
                )}
              </WorkspaceSection>
            </section>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

