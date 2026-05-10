import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { NoOrganisationMembershipShell } from "@/components/organisation/NoOrganisationMembership";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { loadIssuePageContext } from "@/lib/organisations/loadIssuePageContext";
import { enrichActivityRowsForIssue } from "@/lib/issues/enrichActivityTimeline";
import { activityKindLabel, activityTimelineDisplaySummary, formatActivityTimestamp } from "@/lib/issues/activityTimelineDisplay";
import type { SerializedActivityRow } from "@/lib/issues/activityTimelineDisplay";

import { ActivityTimelineClient } from "./activity-timeline.client";

export const dynamic = "force-dynamic";

export default async function IssueActivityPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const page = await loadIssuePageContext(issueId);
  if (page.outcome === "unauthorized") redirect("/login");
  if (page.outcome === "no_membership") return <NoOrganisationMembershipShell />;
  if (page.outcome === "not_found") notFound();
  const { issue } = page;

  const activities = await prisma.issueActivity.findMany({
    where: { issueId: issue.id },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
  });

  const serialized: SerializedActivityRow[] = activities.map((a) => ({
    id: a.id,
    kind: a.kind,
    summary: a.summary,
    refType: a.refType,
    refId: a.refId,
    actorLabel: a.actorLabel,
    createdAt: a.createdAt.toISOString(),
  }));

  const timelineItems = await enrichActivityRowsForIssue(issue.id, serialized, {
    viewer: { membershipRole: page.context.membership.role, userId: page.context.user.id },
  });
  const latest = timelineItems[0] ?? null;

  return (
    <MetisShell
      activePath="/activity"
      pageTitle="Activity timeline"
      organisationMembershipRole={page.context.membership.role}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Activity timeline</h2>
                <p className="max-w-3xl text-sm leading-6 text-[--metis-paper-muted]">
                  Records key briefing actions and generated outputs. It is not a full before/after edit history.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6 sm:px-7 sm:py-7">
            <section aria-label="Activity overview">
              <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)] sm:px-5">
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Overview</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                    Showing latest {timelineItems.length}
                  </Badge>
                  {latest ? (
                    <>
                      <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                        Latest · {activityKindLabel(latest.kind)}
                      </Badge>
                      <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                        {formatActivityTimestamp(latest.createdAt)}
                      </Badge>
                    </>
                  ) : (
                    <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-elevated)_62%,transparent)] text-[--metis-text-secondary]">
                      No events yet
                    </Badge>
                  )}
                </div>
                {latest ? (
                  <p className="mt-2 text-xs leading-relaxed text-[--metis-text-tertiary]">
                    {activityTimelineDisplaySummary(latest)}
                  </p>
                ) : null}
              </div>
            </section>

            <ActivityTimelineClient issueId={issue.id} items={timelineItems} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="grid gap-3 px-5 py-5">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}`}>Workspace</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/brief?mode=full`}>Open brief</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/messages`}>Messages</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/sources`}>Open sources</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/gaps`}>Open questions</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}#input`}>Observations</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/comms-plan`}>Comms plan</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/export`}>Export</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/issues/${issue.id}/compare?mode=full`}>Open delta</Link>
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
