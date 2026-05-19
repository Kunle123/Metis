import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { isIssueDeleted } from "@/lib/issues/issueLifecycle";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { membershipAllowsIssueDelete } from "@/lib/organisations/orgCapabilities";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { requireActiveOrganisationContext } from "@/lib/organisations/activeOrganisationContext";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  if (!membershipAllowsIssueDelete(ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const gated = await requireActiveOrgIssue(request, id);
  if (gated instanceof NextResponse) return gated;

  const { issue } = gated;
  if (isIssueDeleted(issue)) {
    return NextResponse.json({ error: "Issue is already deleted" }, { status: 409 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await writeIssueActivity(tx, {
      issueId: issue.id,
      kind: IssueActivityKinds.issue_deleted,
      summary: "Issue deleted",
      refType: "Issue",
      refId: issue.id,
      actorLabel: ctx.user.email ?? null,
      at: now,
    });
    await tx.issue.update({
      where: { id: issue.id },
      data: { deletedAt: now, deletedById: ctx.user.id },
    });
  });

  revalidatePath("/");

  return NextResponse.json({ ok: true, deletedAt: now.toISOString() });
}
