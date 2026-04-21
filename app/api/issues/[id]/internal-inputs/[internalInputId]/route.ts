import { NextResponse } from "next/server";

import { InternalInputConfidenceSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; internalInputId: string }> }) {
  const { id: issueId, internalInputId } = await params;

  const input = await prisma.internalInput.findFirst({
    where: { id: internalInputId, issueId },
  });

  if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: input.id,
    issueId: input.issueId,
    role: input.role,
    name: input.name,
    response: input.response,
    confidence: InternalInputConfidenceSchema.parse(input.confidence),
    linkedSection: input.linkedSection,
    visibility: input.visibility,
    timestampLabel: input.timestampLabel,
    createdAt: input.createdAt.toISOString(),
  });
}
