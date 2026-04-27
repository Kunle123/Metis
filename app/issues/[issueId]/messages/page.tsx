import Link from "next/link";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

import { MessagesPanel } from "./messages-panel";

export const dynamic = "force-dynamic";

const TEMPLATE = "external_customer_resident_student" as const;

export default async function IssueMessagesPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssueById(issueId);
  if (!issue) {
    return (
      <MetisShell activePath="/messages" pageTitle="Messages" issueRoutePrefix={`/issues/${issueId}`}>
        <SurfaceCard>
          <div className="px-6 py-6 text-[--metis-paper]">Issue not found.</div>
        </SurfaceCard>
      </MetisShell>
    );
  }

  const [issueStakeholders, latestRow] = await Promise.all([
    prisma.issueStakeholder.findMany({
      where: { issueId: issue.id },
      include: { stakeholderGroup: true },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.messageVariant.findFirst({
      where: { issueId: issue.id, templateId: TEMPLATE },
      orderBy: [{ versionNumber: "desc" }],
    }),
  ]);

  const stakeholderOptions = issueStakeholders.map((row) => ({
    id: row.id,
    label: row.stakeholderGroup.name,
  }));

  const initialLatest = latestRow
    ? {
        id: latestRow.id,
        versionNumber: latestRow.versionNumber,
        generatedFromIssueUpdatedAt: latestRow.generatedFromIssueUpdatedAt.toISOString(),
        issueStakeholderId: latestRow.issueStakeholderId,
        artifact: MessageVariantArtifactSchema.parse(latestRow.artifact),
      }
    : null;

  return (
    <MetisShell
      activePath="/messages"
      pageTitle="Message variants"
      issueRoutePrefix={`/issues/${issue.id}`}
      activeIssue={{
        title: issue.title,
        severity: issue.severity,
        openGapsCount: issue.openGapsCount,
        ownerName: issue.ownerName,
        updatedAt: issue.updatedAt,
      }}
    >
      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
          <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Messages</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[--metis-paper-muted]">
            This is not a leadership brief. External updates are deterministic copy derived from the issue record, sources, open gaps, and your
            audience lens. Internal observations are never quoted or paraphrased here.
          </p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
            Template · External / customer–resident–student update
          </p>
        </div>
        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <MessagesPanel
            issueId={issue.id}
            issueTitle={issue.title}
            issueUpdatedAt={issue.updatedAt.toISOString()}
            stakeholderOptions={stakeholderOptions}
            initialLatest={initialLatest}
          />
          <div className="mt-8 border-t border-white/8 pt-6">
            <Link href={`/issues/${issue.id}/export`} className="text-sm text-[--metis-brass-soft] underline-offset-4 hover:underline">
              Circulation package &amp; export →
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </MetisShell>
  );
}
