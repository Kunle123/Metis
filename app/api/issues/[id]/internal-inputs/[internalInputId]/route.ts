import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { InternalInputConfidenceSchema, PatchInternalInputInputSchema } from "@metis/shared/internalInput";
import { prisma } from "@/lib/db/prisma";
import { requireMutation } from "@/lib/governance/requireMutation";

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
    excludedFromBrief: input.excludedFromBrief,
    linkedSection: input.linkedSection,
    visibility: input.visibility,
    timestampLabel: input.timestampLabel,
    createdAt: input.createdAt.toISOString(),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; internalInputId: string }> }) {
  const gate = await requireMutation(request);
  if (gate instanceof NextResponse) return gate;

  const { id: issueId, internalInputId } = await params;
  const json = await request.json();
  const parsed = PatchInternalInputInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const input = await prisma.internalInput.findFirst({
    where: { id: internalInputId, issueId },
  });
  if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.internalInput.update({
    where: { id: internalInputId },
    data: {
      excludedFromBrief: parsed.data.excludedFromBrief ?? input.excludedFromBrief,
    },
  });

  revalidatePath("/");
  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/input`);
  revalidatePath(`/issues/${issueId}/brief`);

  return NextResponse.json({
    id: updated.id,
    issueId: updated.issueId,
    role: updated.role,
    name: updated.name,
    response: updated.response,
    confidence: InternalInputConfidenceSchema.parse(updated.confidence),
    excludedFromBrief: updated.excludedFromBrief,
    linkedSection: updated.linkedSection,
    visibility: updated.visibility,
    timestampLabel: updated.timestampLabel,
    createdAt: updated.createdAt.toISOString(),
  });
}
