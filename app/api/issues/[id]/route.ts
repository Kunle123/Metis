import { NextResponse } from "next/server";

import { UpdateIssueInputSchema } from "@metis/shared/issue";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({ where: { id } });

  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...issue,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = await request.json();
  const parsed = UpdateIssueInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { openGapsCount: _ignoredOpenGapsCount, ...safeUpdate } = parsed.data;

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        ...safeUpdate,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

