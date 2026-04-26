import { NextResponse } from "next/server";

import { CreateBriefVersionInputSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { generateBriefFromIssue } from "@/lib/brief/generateBriefFromIssue";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CreateBriefVersionInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [sources, gaps, internalInputs, issueStakeholders] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.issueStakeholder.findMany({
      where: { issueId },
      include: { stakeholderGroup: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId, mode: parsed.data.mode },
    orderBy: { createdAt: "desc" },
  });

  if (latest && latest.generatedFromIssueUpdatedAt.getTime() === issue.updatedAt.getTime()) {
    return NextResponse.json({
      ...latest,
      generatedFromIssueUpdatedAt: latest.generatedFromIssueUpdatedAt.toISOString(),
      createdAt: latest.createdAt.toISOString(),
    });
  }

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const artifact = generateBriefFromIssue(
    { issue, sources, gaps, internalInputs, issueStakeholders },
    parsed.data.mode,
  );

  const created = await prisma.$transaction(async (tx) => {
    const briefVersion = await tx.briefVersion.create({
      data: {
        issueId,
        mode: parsed.data.mode,
        versionNumber,
        generatedFromIssueUpdatedAt: issue.updatedAt,
        artifact,
      },
    });

    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.brief_version_created,
      summary: `Brief version ${briefVersion.versionNumber} created`,
      refType: "BriefVersion",
      refId: briefVersion.id,
    });

    return briefVersion;
  });

  return NextResponse.json({
    ...created,
    generatedFromIssueUpdatedAt: created.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: created.createdAt.toISOString(),
  });
}

