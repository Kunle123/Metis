import { NextResponse } from "next/server";

import { CompareRequestSchema, CompareResponseSchema, CirculationStateSchema } from "@metis/shared/compare";
import { prisma } from "@/lib/db/prisma";
import { compareBriefArtifacts } from "@/lib/brief/compareBriefVersions";

function serializeBriefVersionMeta(v: {
  id: string;
  issueId: string;
  mode: string;
  versionNumber: number;
  circulationState: string;
  circulationNotes: string | null;
  createdAt: Date;
}) {
  return {
    briefVersionId: v.id,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt.toISOString(),
    circulationState: CirculationStateSchema.parse(v.circulationState),
    circulationNotes: v.circulationNotes ?? null,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);

  const parsed = CompareRequestSchema.safeParse({
    mode: url.searchParams.get("mode"),
    fromBriefVersionId: url.searchParams.get("fromBriefVersionId"),
    toBriefVersionId: url.searchParams.get("toBriefVersionId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { mode, fromBriefVersionId, toBriefVersionId } = parsed.data;

  const [from, to] = await Promise.all([
    prisma.briefVersion.findUnique({ where: { id: fromBriefVersionId } }),
    prisma.briefVersion.findUnique({ where: { id: toBriefVersionId } }),
  ]);

  if (!from || !to || from.issueId !== issueId || to.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (from.mode !== mode || to.mode !== mode) {
    return NextResponse.json({ error: "Mode mismatch" }, { status: 400 });
  }

  const existing = await prisma.briefComparison.findUnique({
    where: { fromBriefVersionId_toBriefVersionId: { fromBriefVersionId, toBriefVersionId } },
  });

  const computedSummary = compareBriefArtifacts(from.artifact as any, to.artifact as any);
  const summary = existing ? (existing.summary as any) : computedSummary;
  const changeCount = existing ? existing.changeCount : computedSummary.groups.reduce((acc, g) => acc + g.items.length, 0);

  const response = {
    issueId,
    mode,
    from: serializeBriefVersionMeta(from),
    to: serializeBriefVersionMeta(to),
    changeCount,
    summary,
    persisted: Boolean(existing),
    comparisonId: existing?.id ?? null,
    createdAt: existing?.createdAt.toISOString() ?? null,
  };

  return NextResponse.json(CompareResponseSchema.parse(response));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const json = await request.json();
  const parsed = CompareRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { mode, fromBriefVersionId, toBriefVersionId } = parsed.data;

  const [from, to] = await Promise.all([
    prisma.briefVersion.findUnique({ where: { id: fromBriefVersionId } }),
    prisma.briefVersion.findUnique({ where: { id: toBriefVersionId } }),
  ]);

  if (!from || !to || from.issueId !== issueId || to.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (from.mode !== mode || to.mode !== mode) {
    return NextResponse.json({ error: "Mode mismatch" }, { status: 400 });
  }

  const computedSummary = compareBriefArtifacts(from.artifact as any, to.artifact as any);
  const changeCount = computedSummary.groups.reduce((acc, g) => acc + g.items.length, 0);

  const created = await prisma.briefComparison.upsert({
    where: { fromBriefVersionId_toBriefVersionId: { fromBriefVersionId, toBriefVersionId } },
    update: {
      mode,
      issueId,
      changeCount,
      summary: computedSummary as any,
    },
    create: {
      mode,
      issueId,
      fromBriefVersionId,
      toBriefVersionId,
      changeCount,
      summary: computedSummary as any,
    },
  });

  const response = {
    issueId,
    mode,
    from: serializeBriefVersionMeta(from),
    to: serializeBriefVersionMeta(to),
    changeCount: created.changeCount,
    summary: created.summary as any,
    persisted: true,
    comparisonId: created.id,
    createdAt: created.createdAt.toISOString(),
  };

  return NextResponse.json(CompareResponseSchema.parse(response));
}

