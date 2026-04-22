import { NextResponse } from "next/server";

import { CreateIssueInputSchema } from "@metis/shared/issue";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const issues = await prisma.issue.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(
    issues.map((issue) => ({
      ...issue,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    })),
  );
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = CreateIssueInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const created = await prisma.issue.create({
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      issueType: parsed.data.issueType,
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

  return NextResponse.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}

