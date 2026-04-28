import { NextResponse } from "next/server";

import { CreateIssueInputSchema } from "@metis/shared/issue";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";

export async function GET() {
  const issues = await prisma.issue.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    issues.map((issue) => ({
      ...issue,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      lastActivityAt: issue.lastActivityAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

  const json = await request.json();
  const parsed = CreateIssueInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const titleTrimmed = parsed.data.title.trim();
  const issueTypeTrimmed = parsed.data.issueType.trim();
  const summaryTrimmed = parsed.data.summary.trim();

  if (!titleTrimmed.length || !issueTypeTrimmed.length || !summaryTrimmed.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const issue = await tx.issue.create({
      data: {
        title: titleTrimmed,
        summary: summaryTrimmed,
        confirmedFacts: parsed.data.confirmedFacts ?? null,
        openQuestions: parsed.data.openQuestions ?? null,
        context: parsed.data.context ?? null,
        issueType: issueTypeTrimmed,
        severity: parsed.data.severity,
        status: parsed.data.status,
        priority: parsed.data.priority ?? "Normal",
        operatorPosture: parsed.data.operatorPosture ?? "Monitoring",
        ownerName: parsed.data.ownerName ?? null,
        audience: parsed.data.audience ?? null,
        // `openGapsCount` is derived from persisted `Gap` rows; ignore any client-provided value.
        openGapsCount: 0,
        sourcesCount: parsed.data.sourcesCount ?? 0,
      },
    });

    await writeIssueActivity(tx, {
      issueId: issue.id,
      kind: IssueActivityKinds.issue_created,
      summary: `Issue created: ${issue.title}`,
      refType: "Issue",
      refId: issue.id,
      actorLabel: user.email ?? null,
    });

    return issue;
  });

  return NextResponse.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    lastActivityAt: created.lastActivityAt.toISOString(),
  });
}

