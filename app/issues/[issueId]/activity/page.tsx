import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  issue_triage_updated: "Issue · triage updated",
  brief_version_created: "Brief · new version",
  gap_created: "Gap · created",
  gap_resolved: "Gap · resolved",
  gap_reopened: "Gap · reopened",
  internal_input_created: "Observation · added",
  source_created: "Source · added",
  export_created: "Export · created",
  circulation_event_created: "Circulation · logged",
  message_variant_created: "Message · generated",
};

function formatActivityTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function kindLabel(kind: string) {
  return KIND_LABELS[kind] ?? kind.replaceAll("_", " ");
}

function shortRefId(id: string) {
  const t = id.trim();
  if (t.length <= 8) return t;
  return `…${t.slice(-8)}`;
}

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
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Recent activity</h2>
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
                  <div
                    key={a.id}
                    className="rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.05)] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        {kindLabel(a.kind)}
                      </p>
                      <p className="shrink-0 text-[0.68rem] tabular-nums text-[--metis-ink-soft]" title={a.createdAt.toISOString()}>
                        {formatActivityTimestamp(a.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-[--metis-paper]">{a.summary}</p>
                    {a.actorLabel ? (
                      <p className="mt-1.5 text-xs leading-5 text-[--metis-paper-muted]">
                        <span className="text-[--metis-ink-soft]">Actor</span>
                        {" · "}
                        {a.actorLabel}
                      </p>
                    ) : null}
                    {a.refType || a.refId ? (
                      <p className="mt-1 text-xs leading-5 text-[--metis-paper-muted]">
                        {a.refType ? (
                          <span className="font-mono text-[0.7rem] text-[rgba(176,171,160,0.85)]">{a.refType}</span>
                        ) : (
                          <span className="font-mono text-[0.7rem] text-[rgba(176,171,160,0.85)]">Ref</span>
                        )}
                        {a.refId ? (
                          <>
                            {" · "}
                            <span className="font-mono text-[0.7rem]">{shortRefId(a.refId)}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
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

