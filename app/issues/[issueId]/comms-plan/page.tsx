import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import {
  CommsPlanOutputTypeSchema,
  CommsPlanScheduleTypeSchema,
  CommsPlanStatusSchema,
  CommsPlanTriggerTypeSchema,
} from "@metis/shared/commsPlan";
import { MessageVariantTemplateIdSchema } from "@metis/shared/messageVariant";
import { BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema } from "@metis/shared/export";

import { CommsPlanClient } from "./planner.client";

export const dynamic = "force-dynamic";

export default async function IssueCommsPlanPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);

  if (!issue) {
    return (
      <MetisShell activePath="/comms-plan" pageTitle="Comms plan" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const [items, activeGroups] = await Promise.all([
    prisma.commsPlanItem.findMany({
      where: { issueId: issue.id },
      orderBy: [{ nextDueAt: "asc" }, { createdAt: "desc" }],
      include: { stakeholderGroup: { select: { name: true } } },
    }),
    prisma.stakeholderGroup.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <MetisShell
      activePath="/comms-plan"
      pageTitle="Comms plan"
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
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.015)] px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Comms plan</h2>
                <p className="max-w-3xl text-sm leading-6 text-[--metis-paper-muted]">
                  Plan what needs to be prepared, for whom, when, and through which channel.{" "}
                  <span className="text-[--metis-paper]">Marking something prepared is not the same as sent.</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button asChild variant="outline">
                  <Link href={`/issues/${issue.id}`}>Back to workspace</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <CommsPlanClient
              issueId={issue.id}
              initialItems={items.map((i) => ({
                id: i.id,
                issueId: i.issueId,
                stakeholderGroupId: i.stakeholderGroupId ?? null,
                stakeholderGroupName: i.stakeholderGroup?.name ?? null,
                title: i.title,
                outputType: CommsPlanOutputTypeSchema.parse(i.outputType),
                messageTemplateId: i.messageTemplateId ? MessageVariantTemplateIdSchema.parse(i.messageTemplateId) : null,
                briefMode: i.briefMode ? BriefModeSchema.parse(i.briefMode) : null,
                exportFormat: i.exportFormat ? ExportFormatSchema.parse(i.exportFormat) : null,
                channel: i.channel,
                scheduleType: CommsPlanScheduleTypeSchema.parse(i.scheduleType),
                cadenceMinutes: i.cadenceMinutes ?? null,
                triggerType: i.triggerType ? CommsPlanTriggerTypeSchema.parse(i.triggerType) : null,
                nextDueAt: i.nextDueAt ? i.nextDueAt.toISOString() : null,
                owner: i.owner ?? null,
                status: CommsPlanStatusSchema.parse(i.status),
                notes: i.notes ?? null,
                lastPreparedAt: i.lastPreparedAt ? i.lastPreparedAt.toISOString() : null,
                lastSentAt: i.lastSentAt ? i.lastSentAt.toISOString() : null,
                lastSkippedAt: i.lastSkippedAt ? i.lastSkippedAt.toISOString() : null,
                skipReason: i.skipReason ?? null,
                preparedFromMessageVariantId: i.preparedFromMessageVariantId ?? null,
                preparedFromBriefVersionId: i.preparedFromBriefVersionId ?? null,
                preparedFromExportId: i.preparedFromExportId ?? null,
                createdAt: i.createdAt.toISOString(),
                updatedAt: i.updatedAt.toISOString(),
              }))}
              audienceGroups={activeGroups.map((g) => ({ id: g.id, name: g.name }))}
              defaultOwner={issue.ownerName ?? null}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
          <div className="space-y-4 px-5 py-5">
            <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Prepare</p>
              <div className="mt-3 grid gap-2">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/messages`}>Open Messages</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/brief?mode=full`}>Open Full brief</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/brief?mode=executive`}>Open Executive brief</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href={`/issues/${issue.id}/export`}>Open Export</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Reminder</p>
              <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">
                This planner does not send communications. Use it to track what should be prepared and what has actually been sent.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}

