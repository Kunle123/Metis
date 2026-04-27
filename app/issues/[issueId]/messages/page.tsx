import Link from "next/link";
import { redirect } from "next/navigation";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";

import { MessagesPanel } from "./messages-panel";

export const dynamic = "force-dynamic";

const TEMPLATE = "external_customer_resident_student" as const;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function resolveSelectedStakeholderId(
  lensRaw: string | undefined,
  stakeholderRows: { id: string }[],
): string | null {
  if (lensRaw === undefined || lensRaw === "" || lensRaw === "issue") return null;
  if (stakeholderRows.some((r) => r.id === lensRaw)) return lensRaw;
  return null;
}

export default async function IssueMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ issueId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { issueId } = await params;
  const sp = (await searchParams) ?? {};
  const lensRaw = typeof sp.lens === "string" ? sp.lens : Array.isArray(sp.lens) ? sp.lens[0] : undefined;

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

  const issueStakeholders = await prisma.issueStakeholder.findMany({
    where: { issueId: issue.id },
    include: { stakeholderGroup: true },
    orderBy: [{ createdAt: "asc" }],
  });

  if (lensRaw && lensRaw !== "issue" && !issueStakeholders.some((r) => r.id === lensRaw)) {
    redirect(`/issues/${issue.id}/messages?lens=issue`);
  }

  const selectedStakeholderId = resolveSelectedStakeholderId(lensRaw, issueStakeholders);

  const latestRow = await prisma.messageVariant.findFirst({
    where: {
      issueId: issue.id,
      templateId: TEMPLATE,
      issueStakeholderId: selectedStakeholderId,
    },
    orderBy: [{ versionNumber: "desc" }],
  });

  const stakeholderOptions = issueStakeholders.map((row) => ({
    id: row.id,
    label: row.stakeholderGroup.name,
  }));

  const selectedLensLabel =
    selectedStakeholderId === null
      ? cleanText(issue.audience)
        ? `Issue-level audience (${cleanText(issue.audience)})`
        : "Issue-level audience only"
      : (issueStakeholders.find((r) => r.id === selectedStakeholderId)?.stakeholderGroup.name ?? "Audience");

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
            selectedStakeholderId={selectedStakeholderId}
            selectedLensLabel={selectedLensLabel}
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
