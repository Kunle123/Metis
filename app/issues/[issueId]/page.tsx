import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";

import { SourceEntryForm } from "./sources/source-entry-form";
import { GapCreateForm } from "./gaps/gap-create-form";
import { InternalInputCreateForm } from "./input/input-create-form";
import { WorkspaceGapCards, WorkspaceSourceCards, WorkspaceObservationCards } from "./workspace-cards";
import { WorkspaceStakeholders } from "./workspace-stakeholders";
import { WorkspaceSection } from "./workspace-section";

export const dynamic = "force-dynamic";

function sectionNavItem(id: string, label: string) {
  return (
    <a
      key={id}
      href={`#${id}`}
      className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.025)] px-3.5 py-2 text-sm text-[--metis-paper-muted] transition hover:border-white/14 hover:bg-white/[0.05] hover:text-[--metis-paper]"
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

  const [sources, gaps, inputs, stakeholderGroups, issueStakeholders] = await Promise.all([
    prisma.source.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId: issue.id }, orderBy: [{ createdAt: "desc" }] }),
    prisma.stakeholderGroup.findMany({ orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }, { name: "asc" }] }),
    prisma.issueStakeholder.findMany({
      where: { issueId: issue.id },
      include: { stakeholderGroup: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

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
                <Badge className="border-0 bg-[rgba(131,82,17,0.72)] text-amber-50">Open questions · {issue.openGapsCount}</Badge>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {[
                ["summary", "Issue summary"],
                ["facts", "Confirmed vs unclear"],
                ["sources", "Sources"],
                ["gaps", "Open questions"],
                  ["input", "Observations"],
                ["stakeholders", "Audience lens"],
              ].map(([id, label]) => sectionNavItem(id, label))}
            </div>
          </div>

          <div className="space-y-7 px-6 py-6 sm:px-7 sm:py-7">
            <section id="summary" className="space-y-4">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Issue summary</p>
                <h3 className="text-[1.35rem] font-medium leading-8 text-[--metis-paper]">{issue.title}</h3>
                <p className="max-w-4xl text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.summary}</p>
              </div>
            </section>

            <section id="facts" className="space-y-5 border-t border-white/8 pt-7">
              <div className="space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Confirmed vs unclear</p>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">Keep facts and unknowns separate.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border] bg-[rgba(255,255,255,0.03)] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Confirmed facts</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.confirmedFacts ?? "—"}</p>
                </div>
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border] bg-[rgba(255,255,255,0.03)] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Open questions</p>
                  <p className="text-sm leading-7 text-[--metis-paper] whitespace-pre-wrap">{issue.openQuestions ?? "—"}</p>
                </div>
              </div>
              {issue.context ? (
                <div className="space-y-2 rounded-[1.25rem] border border-[--metis-info-border] bg-[rgba(0,0,0,0.18)] px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Context</p>
                  <p className="text-sm leading-7 text-[--metis-paper-muted] whitespace-pre-wrap">{issue.context}</p>
                </div>
              ) : null}
            </section>

            <section id="sources" className="space-y-5 border-t border-white/8 pt-7">
              <WorkspaceSection
                title="Sources"
                description="Evidence and artifacts linked to this issue."
                addLabel="Add source"
                advancedHref={`/issues/${issue.id}/sources`}
                form={<SourceEntryForm issueId={issue.id} />}
              >
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

            <section id="gaps" className="space-y-5 border-t border-white/8 pt-7">
              <WorkspaceSection
                title="Open questions"
                description="Unknowns and questions that must be answered."
                addLabel="Add open question"
                advancedHref={`/issues/${issue.id}/gaps`}
                form={<GapCreateForm issueId={issue.id} />}
              >
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

            <section id="input" className="space-y-5 border-t border-white/8 pt-7">
              <WorkspaceSection
                title="Observations"
                description="Attributable internal observations linked to sections."
                addLabel="Add observation"
                advancedHref={`/issues/${issue.id}/input`}
                form={<InternalInputCreateForm issueId={issue.id} />}
              >
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Observations are attributable internal statements. Sources are external or internal artifacts used as evidence.
                </p>
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
            </section>

            <section id="stakeholders" className="space-y-5 border-t border-white/8 pt-7">
              <WorkspaceSection
                title="Audience lens"
                description="Plan outputs by audience group. Sources, gaps, and observations remain the stakeholder-agnostic truth layer."
                addLabel="Add audience group"
                advancedHref="/stakeholders"
                form={
                  <div className="text-sm text-[--metis-paper-muted]">
                    Select an audience group below, then capture messaging notes inside each card. This does not change the underlying issue record.
                  </div>
                }
              >
                <WorkspaceStakeholders
                  issueId={issue.id}
                  allGroups={stakeholderGroups.map((g) => ({
                    id: g.id,
                    name: g.name,
                    description: g.description ?? null,
                    defaultSensitivity: g.defaultSensitivity ?? null,
                    defaultChannels: g.defaultChannels ?? null,
                    defaultToneGuidance: g.defaultToneGuidance ?? null,
                    displayOrder: g.displayOrder,
                    isActive: g.isActive,
                  }))}
                  selected={issueStakeholders.map((s) => ({
                    id: s.id,
                    stakeholderGroupId: s.stakeholderGroupId,
                    priority: (s.priority as any) ?? "Normal",
                    needsToKnow: s.needsToKnow,
                    issueRisk: s.issueRisk,
                    channelGuidance: s.channelGuidance,
                    toneAdjustment: s.toneAdjustment ?? null,
                    notes: s.notes ?? null,
                    group: {
                      id: s.stakeholderGroup.id,
                      name: s.stakeholderGroup.name,
                      description: s.stakeholderGroup.description ?? null,
                      defaultSensitivity: s.stakeholderGroup.defaultSensitivity ?? null,
                      defaultChannels: s.stakeholderGroup.defaultChannels ?? null,
                      defaultToneGuidance: s.stakeholderGroup.defaultToneGuidance ?? null,
                      displayOrder: s.stakeholderGroup.displayOrder,
                      isActive: s.stakeholderGroup.isActive,
                    },
                  }))}
                />
              </WorkspaceSection>
            </section>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

