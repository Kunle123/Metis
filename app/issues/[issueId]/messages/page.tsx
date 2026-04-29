import Link from "next/link";
import { redirect } from "next/navigation";

import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { prisma } from "@/lib/db/prisma";
import { getIssueById } from "@/lib/issues/getIssueContext";
import { MessageVariantArtifactSchema, MessageVariantTemplateIdSchema } from "@metis/shared/messageVariant";

import { MessagesPanel } from "./messages-panel";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
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
  const templateRaw =
    typeof sp.template === "string" ? sp.template : Array.isArray(sp.template) ? sp.template[0] : undefined;
  const parsedTemplate = MessageVariantTemplateIdSchema.safeParse(templateRaw ?? "external_customer_resident_student");
  const templateId = parsedTemplate.success ? parsedTemplate.data : "external_customer_resident_student";

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

  const activeGroups = await prisma.stakeholderGroup.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  let selectedStakeholderGroupId: string | null = null;

  if (lensRaw === undefined || lensRaw === "" || lensRaw === "issue") {
    selectedStakeholderGroupId = null;
  } else if (UUID_RE.test(lensRaw)) {
    if (activeGroups.some((g) => g.id === lensRaw)) {
      selectedStakeholderGroupId = lensRaw;
    } else {
      const legacyStakeholder = await prisma.issueStakeholder.findFirst({
        where: { id: lensRaw, issueId: issue.id },
        select: { stakeholderGroupId: true },
      });
      if (legacyStakeholder) {
        redirect(`/issues/${issue.id}/messages?lens=${encodeURIComponent(legacyStakeholder.stakeholderGroupId)}`);
      }
      redirect(`/issues/${issue.id}/messages?lens=issue`);
    }
  } else {
    redirect(`/issues/${issue.id}/messages?lens=issue`);
  }

  const latestRow = await prisma.messageVariant.findFirst({
    where: {
      issueId: issue.id,
      templateId,
      stakeholderGroupId: selectedStakeholderGroupId,
    },
    orderBy: [{ versionNumber: "desc" }],
  });

  const messagesAiCleanupEnabled = process.env.MESSAGES_AI_CLEANUP_ENABLED === "true";

  const audienceGroupOptions = activeGroups.map((g) => ({
    id: g.id,
    label: g.name,
  }));

  const selectedAudienceGroupLabel =
    selectedStakeholderGroupId === null
      ? "General (no audience group)"
      : (activeGroups.find((g) => g.id === selectedStakeholderGroupId)?.name ?? "Audience group");

  const initialLatest = latestRow
    ? {
        id: latestRow.id,
        versionNumber: latestRow.versionNumber,
        generatedFromIssueUpdatedAt: latestRow.generatedFromIssueUpdatedAt.toISOString(),
        stakeholderGroupId: latestRow.stakeholderGroupId,
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
            selected organisation-level audience group defaults (Settings → Audience groups). Internal observations are never quoted or paraphrased here.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <MessagesPanel
            issueId={issue.id}
            issueTitle={issue.title}
            issueUpdatedAt={issue.updatedAt.toISOString()}
            selectedTemplateId={templateId}
            audienceGroupOptions={audienceGroupOptions}
            selectedStakeholderGroupId={selectedStakeholderGroupId}
            selectedAudienceGroupLabel={selectedAudienceGroupLabel}
            initialLatest={initialLatest}
            messagesAiCleanupEnabled={messagesAiCleanupEnabled}
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
