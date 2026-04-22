import { NextResponse } from "next/server";

import { ListIssueActivityResponseSchema } from "@metis/shared/activity";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(100, limitRaw ? Number(limitRaw) : 40));

  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { id: true } });
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.issueActivity.findMany({
    where: { issueId },
    orderBy: [{ createdAt: "desc" }],
    take: Number.isFinite(limit) ? limit : 40,
  });

  return NextResponse.json(
    ListIssueActivityResponseSchema.parse({
      items: items.map((a) => ({
        id: a.id,
        issueId: a.issueId,
        kind: a.kind,
        summary: a.summary,
        refType: a.refType ?? null,
        refId: a.refId ?? null,
        actorLabel: a.actorLabel ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    }),
  );
}

