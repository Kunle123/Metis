import { NextResponse } from "next/server";

import { CreateCirculationEventInputSchema, CirculationEventResponseSchema } from "@metis/shared/circulation";
import { CirculationStateSchema } from "@metis/shared/compare";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateCirculationEventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { briefVersionId, exportId, actorLabel, eventType, channel, audienceLabel, postureState, note } = parsed.data;

  const briefVersion = await prisma.briefVersion.findUnique({ where: { id: briefVersionId } });
  if (!briefVersion || briefVersion.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ensure the logged postureState is within canonical vocabulary.
  CirculationStateSchema.parse(postureState);

  if (exportId) {
    const exportRow = await prisma.artifactExport.findUnique({ where: { id: exportId } });
    if (!exportRow || exportRow.issueId !== issueId) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }
  }

  const created = await prisma.circulationEvent.create({
    data: {
      issueId,
      briefVersionId,
      exportId: exportId ?? null,
      actorLabel: actorLabel ?? null,
      eventType,
      channel: channel ?? null,
      audienceLabel: audienceLabel ?? null,
      postureState,
      note: note ?? null,
    },
  });

  const response = {
    id: created.id,
    issueId: created.issueId,
    briefVersionId: created.briefVersionId,
    exportId: created.exportId ?? null,
    actorLabel: created.actorLabel ?? null,
    eventType: created.eventType,
    channel: created.channel ?? null,
    audienceLabel: created.audienceLabel ?? null,
    postureState: created.postureState,
    note: created.note ?? null,
    createdAt: created.createdAt.toISOString(),
  };

  return NextResponse.json(CirculationEventResponseSchema.parse(response));
}

