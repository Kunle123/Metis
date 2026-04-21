import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ briefVersionId: string }> }) {
  const { briefVersionId } = await params;
  const briefVersion = await prisma.briefVersion.findUnique({ where: { id: briefVersionId } });

  if (!briefVersion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...briefVersion,
    generatedFromIssueUpdatedAt: briefVersion.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: briefVersion.createdAt.toISOString(),
  });
}

