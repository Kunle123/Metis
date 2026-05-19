import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { isIssueArchived, isIssueDeleted } from "@/lib/issues/issueLifecycle";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { requireActiveOrganisationWriteContext } from "@/lib/organisations/requireOrganisationCapability";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireActiveOrganisationWriteContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const gated = await requireActiveOrgIssue(request, id);
  if (gated instanceof NextResponse) return gated;

  const { issue } = gated;
  if (isIssueDeleted(issue)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isIssueArchived(issue)) {
    return NextResponse.json({ error: "Issue is not archived" }, { status: 409 });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.issue.update({
      where: { id: issue.id },
      data: { archivedAt: null, archivedById: null },
    });
    await writeIssueActivity(tx, {
      issueId: issue.id,
      kind: IssueActivityKinds.issue_reopened,
      summary: "Issue reopened",
      refType: "Issue",
      refId: issue.id,
      actorLabel: ctx.user.email ?? null,
      at: now,
    });
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issue.id}`);
  revalidatePath(`/issues/${issue.id}/input`);

  return NextResponse.json({ ok: true });
}
