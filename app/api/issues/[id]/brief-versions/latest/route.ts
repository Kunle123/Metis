import { NextResponse } from "next/server";

import { BriefModeSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);
  const modeRaw = url.searchParams.get("mode");

  const parsedMode = BriefModeSchema.safeParse(modeRaw);
  if (!parsedMode.success) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  const latest = await prisma.briefVersion.findFirst({
    where: { issueId, mode: parsedMode.data },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...latest,
    generatedFromIssueUpdatedAt: latest.generatedFromIssueUpdatedAt.toISOString(),
    createdAt: latest.createdAt.toISOString(),
  });
}

