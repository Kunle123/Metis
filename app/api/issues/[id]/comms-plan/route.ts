import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireMutation } from "@/lib/governance/requireMutation";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { CreateCommsPlanItemInputSchema } from "@metis/shared/commsPlan";

function toIsoOrNull(d: Date | null) {
  return d ? d.toISOString() : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAuth(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId } = await params;
  const items = await prisma.commsPlanItem.findMany({
    where: { issueId },
    orderBy: [{ nextDueAt: "asc" }, { createdAt: "desc" }],
    include: { stakeholderGroup: { select: { name: true } } },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      issueId: i.issueId,
      stakeholderGroupId: i.stakeholderGroupId ?? null,
      stakeholderGroupName: i.stakeholderGroup?.name ?? null,
      title: i.title,
      outputType: i.outputType,
      messageTemplateId: i.messageTemplateId ?? null,
      briefMode: i.briefMode ?? null,
      exportFormat: i.exportFormat ?? null,
      channel: i.channel,
      scheduleType: i.scheduleType,
      cadenceMinutes: i.cadenceMinutes ?? null,
      triggerType: i.triggerType ?? null,
      nextDueAt: toIsoOrNull(i.nextDueAt),
      owner: i.owner ?? null,
      status: i.status,
      notes: i.notes ?? null,
      lastPreparedAt: toIsoOrNull(i.lastPreparedAt),
      lastSentAt: toIsoOrNull(i.lastSentAt),
      lastSkippedAt: toIsoOrNull(i.lastSkippedAt),
      skipReason: i.skipReason ?? null,
      preparedFromMessageVariantId: i.preparedFromMessageVariantId ?? null,
      preparedFromBriefVersionId: i.preparedFromBriefVersionId ?? null,
      preparedFromExportId: i.preparedFromExportId ?? null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CreateCommsPlanItemInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.commsPlanItem.create({
      data: {
        issueId,
        stakeholderGroupId: parsed.data.stakeholderGroupId ?? null,
        title: parsed.data.title.trim(),
        outputType: parsed.data.outputType,
        messageTemplateId: parsed.data.messageTemplateId ?? null,
        briefMode: parsed.data.briefMode ?? null,
        exportFormat: parsed.data.exportFormat ?? null,
        channel: parsed.data.channel.trim(),
        scheduleType: parsed.data.scheduleType,
        cadenceMinutes: parsed.data.cadenceMinutes ?? null,
        triggerType: parsed.data.triggerType ?? null,
        nextDueAt: parsed.data.nextDueAt ? new Date(parsed.data.nextDueAt) : null,
        owner: parsed.data.owner?.trim() ? parsed.data.owner.trim() : null,
        notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
        status: "planned",
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.comms_plan_item_created,
      summary: "Comms plan item created",
      refType: "CommsPlanItem",
      refId: row.id,
      actorLabel: user.email ?? null,
    });

    return row;
  });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/comms-plan`);

  return NextResponse.json({
    id: created.id,
    issueId: created.issueId,
    stakeholderGroupId: created.stakeholderGroupId ?? null,
    title: created.title,
    outputType: created.outputType,
    messageTemplateId: created.messageTemplateId ?? null,
    briefMode: created.briefMode ?? null,
    exportFormat: created.exportFormat ?? null,
    channel: created.channel,
    scheduleType: created.scheduleType,
    cadenceMinutes: created.cadenceMinutes ?? null,
    triggerType: created.triggerType ?? null,
    nextDueAt: toIsoOrNull(created.nextDueAt),
    owner: created.owner ?? null,
    status: created.status,
    notes: created.notes ?? null,
    lastPreparedAt: toIsoOrNull(created.lastPreparedAt),
    lastSentAt: toIsoOrNull(created.lastSentAt),
    lastSkippedAt: toIsoOrNull(created.lastSkippedAt),
    skipReason: created.skipReason ?? null,
    preparedFromMessageVariantId: created.preparedFromMessageVariantId ?? null,
    preparedFromBriefVersionId: created.preparedFromBriefVersionId ?? null,
    preparedFromExportId: created.preparedFromExportId ?? null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}

