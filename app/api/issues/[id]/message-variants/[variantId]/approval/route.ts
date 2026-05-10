import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { PatchApprovalStatusBodySchema, approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import { MessageVariantArtifactSchema } from "@metis/shared/messageVariant";
import { prisma } from "@/lib/db/prisma";
import { coerceMessageApprovalStatus } from "@/lib/approvals/coerceMessageApprovalStatus";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";

function serializeApprovalPatchRow(row: {
  id: string;
  issueId: string;
  templateId: string;
  versionNumber: number;
  generatedFromIssueUpdatedAt: Date;
  stakeholderGroupId: string | null;
  issueStakeholderId: string | null;
  audienceSnapshot: unknown;
  artifact: unknown;
  approvalStatus: string;
  approvalUpdatedAt: Date | null;
  approvalUpdatedByUserId: string | null;
  createdAt: Date;
}) {
  const artifact = MessageVariantArtifactSchema.parse(row.artifact);
  return {
    id: row.id,
    issueId: row.issueId,
    templateId: row.templateId,
    versionNumber: row.versionNumber,
    generatedFromIssueUpdatedAt: row.generatedFromIssueUpdatedAt.toISOString(),
    stakeholderGroupId: row.stakeholderGroupId,
    issueStakeholderId: row.issueStakeholderId,
    audienceSnapshot: row.audienceSnapshot as Record<string, unknown>,
    artifact,
    approvalStatus: coerceMessageApprovalStatus(row.approvalStatus),
    approvalUpdatedAt: row.approvalUpdatedAt?.toISOString() ?? null,
    approvalUpdatedByUserId: row.approvalUpdatedByUserId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id: issueId, variantId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = PatchApprovalStatusBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.messageVariant.findFirst({
    where: { id: variantId, issueId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const label = approvalStatusDisplayLabel(parsed.data.approvalStatus);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.messageVariant.update({
      where: { id: variantId },
      data: {
        approvalStatus: parsed.data.approvalStatus,
        approvalUpdatedAt: new Date(),
        approvalUpdatedByUserId: gated.ctx.user.id,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.message_variant_approval_updated,
      summary: `Message draft approval updated to ${label}`,
      refType: "MessageVariant",
      refId: variantId,
      actorLabel: gated.ctx.user.email ?? null,
    });

    return row;
  });

  revalidatePath(`/issues/${issueId}/messages`);
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/");

  return NextResponse.json(serializeApprovalPatchRow(updated));
}
