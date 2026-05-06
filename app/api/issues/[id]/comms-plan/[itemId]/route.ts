import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireMutation } from "@/lib/governance/requireMutation";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { UpdateCommsPlanItemInputSchema } from "@metis/shared/commsPlan";

function toIsoOrNull(d: Date | null) {
  return d ? d.toISOString() : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId, itemId } = await params;
  const json = await request.json();
  const parsed = UpdateCommsPlanItemInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.commsPlanItem.findFirst({ where: { id: itemId, issueId } });
    if (!existing) return null;

    const nextStatus = parsed.data.status ?? undefined;
    const statusWrite: Record<string, any> = {};
    let activityKind = IssueActivityKinds.comms_plan_item_updated;
    let activitySummary = "Comms plan item updated";

    if (nextStatus && nextStatus !== existing.status) {
      if (nextStatus === "prepared") {
        statusWrite.lastPreparedAt = now;
        activityKind = IssueActivityKinds.comms_plan_item_prepared;
        activitySummary = "Comms plan item marked prepared";
      } else if (nextStatus === "sent") {
        statusWrite.lastSentAt = now;
        activityKind = IssueActivityKinds.comms_plan_item_sent;
        activitySummary = "Comms plan item marked sent";
      } else if (nextStatus === "skipped") {
        statusWrite.lastSkippedAt = now;
        statusWrite.skipReason = (parsed.data.skipReason ?? "").trim() || existing.skipReason;
        activityKind = IssueActivityKinds.comms_plan_item_skipped;
        activitySummary = "Comms plan item marked skipped";
      }
    }

    const row = await tx.commsPlanItem.update({
      where: { id: itemId },
      data: {
        stakeholderGroupId: parsed.data.stakeholderGroupId ?? undefined,
        title: parsed.data.title ? parsed.data.title.trim() : undefined,
        outputType: parsed.data.outputType ?? undefined,
        messageTemplateId: "messageTemplateId" in parsed.data ? parsed.data.messageTemplateId : undefined,
        briefMode: "briefMode" in parsed.data ? parsed.data.briefMode : undefined,
        exportFormat: "exportFormat" in parsed.data ? parsed.data.exportFormat : undefined,
        channel: parsed.data.channel ? parsed.data.channel.trim() : undefined,
        scheduleType: parsed.data.scheduleType ?? undefined,
        cadenceMinutes: "cadenceMinutes" in parsed.data ? parsed.data.cadenceMinutes : undefined,
        triggerType: "triggerType" in parsed.data ? parsed.data.triggerType : undefined,
        nextDueAt: "nextDueAt" in parsed.data ? (parsed.data.nextDueAt ? new Date(parsed.data.nextDueAt) : null) : undefined,
        owner: "owner" in parsed.data ? (parsed.data.owner?.trim() ? parsed.data.owner.trim() : null) : undefined,
        status: parsed.data.status ?? undefined,
        notes: "notes" in parsed.data ? (parsed.data.notes?.trim() ? parsed.data.notes.trim() : null) : undefined,
        skipReason: "skipReason" in parsed.data ? (parsed.data.skipReason?.trim() ? parsed.data.skipReason.trim() : null) : undefined,
        preparedFromMessageVariantId:
          "preparedFromMessageVariantId" in parsed.data ? parsed.data.preparedFromMessageVariantId : undefined,
        preparedFromBriefVersionId:
          "preparedFromBriefVersionId" in parsed.data ? parsed.data.preparedFromBriefVersionId : undefined,
        preparedFromExportId: "preparedFromExportId" in parsed.data ? parsed.data.preparedFromExportId : undefined,
        ...statusWrite,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: activityKind,
      summary: activitySummary,
      refType: "CommsPlanItem",
      refId: row.id,
      actorLabel: user.email ?? null,
    });

    return row;
  });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/comms-plan`);

  return NextResponse.json({
    id: updated.id,
    issueId: updated.issueId,
    stakeholderGroupId: updated.stakeholderGroupId ?? null,
    title: updated.title,
    outputType: updated.outputType,
    messageTemplateId: updated.messageTemplateId ?? null,
    briefMode: updated.briefMode ?? null,
    exportFormat: updated.exportFormat ?? null,
    channel: updated.channel,
    scheduleType: updated.scheduleType,
    cadenceMinutes: updated.cadenceMinutes ?? null,
    triggerType: updated.triggerType ?? null,
    nextDueAt: toIsoOrNull(updated.nextDueAt),
    owner: updated.owner ?? null,
    status: updated.status,
    notes: updated.notes ?? null,
    lastPreparedAt: toIsoOrNull(updated.lastPreparedAt),
    lastSentAt: toIsoOrNull(updated.lastSentAt),
    lastSkippedAt: toIsoOrNull(updated.lastSkippedAt),
    skipReason: updated.skipReason ?? null,
    preparedFromMessageVariantId: updated.preparedFromMessageVariantId ?? null,
    preparedFromBriefVersionId: updated.preparedFromBriefVersionId ?? null,
    preparedFromExportId: updated.preparedFromExportId ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const { id: issueId, itemId } = await params;

  const deleted = await prisma.$transaction(async (tx) => {
    const existing = await tx.commsPlanItem.findFirst({ where: { id: itemId, issueId } });
    if (!existing) return null;

    await tx.commsPlanItem.delete({ where: { id: itemId } });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.comms_plan_item_updated,
      summary: "Comms plan item deleted",
      refType: "CommsPlanItem",
      refId: itemId,
      actorLabel: user.email ?? null,
    });

    return existing;
  });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/comms-plan`);

  return NextResponse.json({ ok: true });
}

