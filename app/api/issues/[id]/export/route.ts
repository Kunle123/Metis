import { NextResponse } from "next/server";

import { BriefModeSchema, BriefArtifactSchema } from "@metis/shared/briefVersion";
import { CirculationStateSchema } from "@metis/shared/compare";
import { ExportFormatSchema, ExportPackageResponseSchema } from "@metis/shared/export";
import { prisma } from "@/lib/db/prisma";
import { renderExportPackage } from "@/lib/export/renderExportPackage";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const url = new URL(request.url);

  const briefVersionId = url.searchParams.get("briefVersionId");
  const formatRaw = url.searchParams.get("format");

  const parsedFormat = ExportFormatSchema.safeParse(formatRaw);
  if (!briefVersionId || !parsedFormat.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [issue, briefVersion] = await Promise.all([
    prisma.issue.findUnique({ where: { id: issueId } }),
    prisma.briefVersion.findUnique({ where: { id: briefVersionId } }),
  ]);

  if (!issue || !briefVersion || briefVersion.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedMode = BriefModeSchema.safeParse(briefVersion.mode);
  if (!parsedMode.success) {
    return NextResponse.json({ error: "Invalid stored mode" }, { status: 500 });
  }

  const artifact = BriefArtifactSchema.parse(briefVersion.artifact);
  const rendered = renderExportPackage({
    issue,
    mode: parsedMode.data,
    format: parsedFormat.data,
    artifact,
  });

  const now = new Date();
  const filename = `metis-${issueId}-${parsedFormat.data}-v${briefVersion.versionNumber}.md`;

  const response = {
    issueId,
    briefVersionId: briefVersion.id,
    mode: parsedMode.data,
    format: parsedFormat.data,
    title: issue.title,
    generatedAt: now.toISOString(),
    filename,
    mimeType: rendered.mimeType,
    content: rendered.content,
    circulationState: CirculationStateSchema.parse(briefVersion.circulationState),
    circulationNotes: briefVersion.circulationNotes ?? null,
  };

  return NextResponse.json(ExportPackageResponseSchema.parse(response));
}

