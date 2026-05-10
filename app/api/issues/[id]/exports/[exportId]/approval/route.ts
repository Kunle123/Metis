import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { PatchApprovalStatusBodySchema, approvalStatusDisplayLabel } from "@metis/shared/approvalStatus";
import { prisma } from "@/lib/db/prisma";
import {
  artifactExportToApiResponse,
  resolveOutputTypeForStoredExport,
} from "@/lib/export/artifactExportWire";
import { ExportFormatSchema } from "@metis/shared/export";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; exportId: string }> }) {
  const { id: issueId, exportId } = await params;

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

  const existing = await prisma.artifactExport.findFirst({
    where: { id: exportId, issueId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const label = approvalStatusDisplayLabel(parsed.data.approvalStatus);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.artifactExport.update({
      where: { id: exportId },
      data: {
        approvalStatus: parsed.data.approvalStatus,
        approvalUpdatedAt: new Date(),
        approvalUpdatedByUserId: gated.ctx.user.id,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.export_approval_updated,
      summary: `Export package approval updated to ${label}`,
      refType: "ArtifactExport",
      refId: exportId,
      actorLabel: gated.ctx.user.email ?? null,
    });

    return row;
  });

  const formatParsed = ExportFormatSchema.safeParse(updated.format);
  const outputType =
    formatParsed.success
      ? resolveOutputTypeForStoredExport(formatParsed.data, updated.mimeType)
      : resolveOutputTypeForStoredExport("executive-brief", updated.mimeType);

  revalidatePath(`/issues/${issueId}/export`);
  revalidatePath(`/issues/${issueId}`);
  revalidatePath("/");

  return NextResponse.json(artifactExportToApiResponse(updated, outputType));
}
