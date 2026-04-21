import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  const source = await prisma.source.findUnique({ where: { id: sourceId } });

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

