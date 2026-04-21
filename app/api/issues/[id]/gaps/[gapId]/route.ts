import { NextResponse } from "next/server";

import { GapSeveritySchema, GapStatusSchema, PatchGapInputSchema } from "@metis/shared/gap";
import { prisma } from "@/lib/db/prisma";
import { isOpenGapStatus } from "@/lib/gaps/openGapsCount";

function serializeGap(gap: {
  id: string;
  issueId: string;
  title: string;
  whyItMatters: string;
  stakeholder: string;
  linkedSection: string;
  severity: string;
  status: string;
  prompt: string;
  resolvedByInternalInputId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: gap.id,
    issueId: gap.issueId,
    title: gap.title,
    whyItMatters: gap.whyItMatters,
    stakeholder: gap.stakeholder,
    linkedSection: gap.linkedSection,
    severity: GapSeveritySchema.parse(gap.severity),
    status: GapStatusSchema.parse(gap.status),
    prompt: gap.prompt,
    resolvedByInternalInputId: gap.resolvedByInternalInputId,
    createdAt: gap.createdAt.toISOString(),
    updatedAt: gap.updatedAt.toISOString(),
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string; gapId: string }> }) {
  const { id: issueId, gapId } = await params;

  const gap = await prisma.gap.findFirst({
    where: { id: gapId, issueId },
  });

  if (!gap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(serializeGap(gap));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; gapId: string }> }) {
  const { id: issueId, gapId } = await params;
  const json = await request.json();
  const parsed = PatchGapInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.gap.findFirst({
    where: { id: gapId, issueId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = parsed.data.status ?? existing.status;
  const nextStatusParsed = GapStatusSchema.safeParse(nextStatus);
  if (!nextStatusParsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const resolvedFieldPresent = parsed.data.resolvedByInternalInputId !== undefined;

  let nextResolvedId: string | null;
  if (nextStatusParsed.data === "Open") {
    nextResolvedId = null;
  } else if (resolvedFieldPresent) {
    nextResolvedId = parsed.data.resolvedByInternalInputId ?? null;
  } else {
    nextResolvedId = existing.resolvedByInternalInputId;
  }

  if (nextStatusParsed.data === "Resolved" && (!nextResolvedId || nextResolvedId.length === 0)) {
    return NextResponse.json({ error: "Resolved gaps must include resolvedByInternalInputId" }, { status: 400 });
  }

  if (resolvedFieldPresent && parsed.data.status === undefined && existing.status === "Open" && parsed.data.resolvedByInternalInputId) {
    return NextResponse.json({ error: "Cannot set resolvedByInternalInputId unless status is Resolved" }, { status: 400 });
  }

  if (nextResolvedId) {
    const input = await prisma.internalInput.findFirst({
      where: { id: nextResolvedId, issueId },
      select: { id: true },
    });
    if (!input) {
      return NextResponse.json({ error: "resolvedByInternalInputId must reference an internal input on this issue" }, { status: 400 });
    }
  }

  const wasOpen = isOpenGapStatus(existing.status);
  const willOpen = isOpenGapStatus(nextStatusParsed.data);
  const openDelta = (wasOpen ? 1 : 0) - (willOpen ? 1 : 0); // +1 means we closed an open gap

  const updated = await prisma.$transaction(async (tx) => {
    const gap = await tx.gap.update({
      where: { id: gapId },
      data: {
        prompt: parsed.data.prompt ?? undefined,
        status: parsed.data.status ?? undefined,
        resolvedByInternalInputId:
          parsed.data.status === undefined && !resolvedFieldPresent
            ? undefined
            : nextResolvedId,
      },
    });

    if (openDelta !== 0) {
      await tx.issue.update({
        where: { id: issueId },
        data: { openGapsCount: { decrement: openDelta } },
      });
    }

    return gap;
  });

  // Post-condition guard: never persist Resolved without linkage.
  if (updated.status === "Resolved" && !updated.resolvedByInternalInputId) {
    return NextResponse.json({ error: "Invariant violated: resolved gap missing internal input" }, { status: 500 });
  }

  return NextResponse.json(serializeGap(updated));
}
