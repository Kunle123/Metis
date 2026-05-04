import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { enrichActivityRowsForIssue } from "@/lib/issues/enrichActivityTimeline";
import type { SerializedActivityRow } from "@/lib/issues/activityTimelineDisplay";

import { ActivityTimelineClient } from "./activity-timeline.client";

export const dynamic = "force-dynamic";

export default async function IssueActivityPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);

  if (!issue) {
    return (
      <MetisShell activePath="/activity" pageTitle="Activity timeline" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

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

  const timelineItems = await enrichActivityRowsForIssue(issue.id, serialized);

  return (
    <MetisShell
      activePath="/activity"
      pageTitle="Activity timeline"
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
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
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
            <ActivityTimelineClient items={timelineItems} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="grid gap-3 px-5 py-5">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/issues/${issue.id}/brief?mode=full`}>Open brief</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/issues/${issue.id}/sources`}>Open sources</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href={`/issues/${issue.id}/compare?mode=full`}>Open delta</Link>
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
