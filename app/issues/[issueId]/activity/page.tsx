import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";

export const dynamic = "force-dynamic";

export default async function IssueActivityPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);

  if (!issue) {
    return (
      <MetisShell activePath="/activity" pageTitle="Activity" issueRoutePrefix={`/issues/${issueId}`}>
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

  return (
    <MetisShell
      activePath="/activity"
      pageTitle="Activity"
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
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
            </div>
          </div>

          <div className="space-y-4 px-6 py-6 sm:px-7 sm:py-7">
            {activities.length === 0 ? (
              <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.04)] px-5 py-5 text-sm leading-7 text-[--metis-paper-muted]">
                No activity recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[--metis-paper]">{a.summary}</p>
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                        {a.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="grid gap-3 px-5 py-5">
            <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
              <Link href={`/issues/${issue.id}/brief?mode=full`}>Open brief</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
              <Link href={`/issues/${issue.id}/sources`}>Open sources</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
              <Link href={`/issues/${issue.id}/compare?mode=full`}>Open delta</Link>
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

