import { NextResponse } from "next/server";

import { UpdateIssueInputSchema } from "@metis/shared/issue";
import { PatchIssueTriageInputSchema } from "@metis/shared/activity";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireActiveOrganisationContext } from "@/lib/organisations/activeOrganisationContext";
import { isIssueWritable } from "@/lib/issues/issueLifecycle";
import { requireActiveOrganisationWriteContext } from "@/lib/organisations/requireOrganisationCapability";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const issue = await prisma.issue.findFirst({
    where: { id, organisationId: ctx.organisation.id, deletedAt: null },
  });

  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...issue,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    lastActivityAt: issue.lastActivityAt.toISOString(),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireActiveOrganisationWriteContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const json = await request.json();
  const parsed = UpdateIssueInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { openGapsCount: _ignoredOpenGapsCount, ...safeUpdate } = parsed.data;

    const triageParsed = PatchIssueTriageInputSchema.safeParse({
      priority: (safeUpdate as any).priority,
      operatorPosture: (safeUpdate as any).operatorPosture,
    });

    if (!triageParsed.success && ("priority" in safeUpdate || "operatorPosture" in safeUpdate)) {
      return NextResponse.json({ error: "Invalid triage fields", issues: triageParsed.error.issues }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.issue.findFirst({
        where: { id, organisationId: ctx.organisation.id, deletedAt: null },
      });
      if (!existing) throw new Error("Not found");
      if (!isIssueWritable(existing)) {
        throw new Error("archived");
      }

      const next = await tx.issue.update({
        where: { id },
        data: {
          ...safeUpdate,
        },
      });

      const changes: string[] = [];
      if (triageParsed.success) {
        if (triageParsed.data.priority && triageParsed.data.priority !== existing.priority) {
          changes.push(`Priority set to ${triageParsed.data.priority}`);
        }
        if (triageParsed.data.operatorPosture && triageParsed.data.operatorPosture !== existing.operatorPosture) {
          changes.push(`Operator posture set to ${triageParsed.data.operatorPosture}`);
        }
      }

      if (changes.length) {
        await writeIssueActivity(tx, {
          issueId: id,
          kind: IssueActivityKinds.issue_triage_updated,
          summary: changes.join(" · "),
          refType: "Issue",
          refId: id,
          actorLabel: ctx.user.email ?? null,
        });

        // Return a fresh read so PATCH reflects persisted lastActivityAt.
        const refreshed = await tx.issue.findUnique({ where: { id } });
        if (!refreshed) throw new Error("Not found");
        return refreshed;
      }

      return next;
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastActivityAt: updated.lastActivityAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "archived") {
      return NextResponse.json(
        { error: "This issue is archived. Reopen it before changing record fields." },
        { status: 403 },
      );
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

