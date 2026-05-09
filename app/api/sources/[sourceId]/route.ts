import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { requireActiveOrganisationContext } from "@/lib/organisations/activeOrganisationContext";

export async function GET(request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const ctx = await requireActiveOrganisationContext(request);
  if (ctx instanceof NextResponse) return ctx;

  const { sourceId } = await params;
  const source = await prisma.source.findFirst({
    where: {
      id: sourceId,
      issue: { organisationId: ctx.organisation.id },
    },
  });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...source,
    note: source.note ?? null,
    snippet: source.snippet ?? null,
    reliability: source.reliability ?? null,
    linkedSection: source.linkedSection ?? null,
    url: source.url ?? null,
    timestampLabel: source.timestampLabel ?? null,
    createdAt: source.createdAt.toISOString(),
  });
}

