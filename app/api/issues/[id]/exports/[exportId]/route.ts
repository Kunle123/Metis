import { NextResponse } from "next/server";

import { ArtifactExportResponseSchema } from "@metis/shared/circulation";
import { BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema } from "@metis/shared/export";
import { prisma } from "@/lib/db/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; exportId: string }> }) {
  const { id: issueId, exportId } = await params;

  const exportRow = await prisma.artifactExport.findUnique({ where: { id: exportId } });
  if (!exportRow || exportRow.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedMode = BriefModeSchema.safeParse(exportRow.mode);
  const parsedFormat = ExportFormatSchema.safeParse(exportRow.format);
  if (!parsedMode.success || !parsedFormat.success) {
    return NextResponse.json({ error: "Invalid stored export" }, { status: 500 });
  }

  const response = {
    exportId: exportRow.id,
    issueId: exportRow.issueId,
    briefVersionId: exportRow.briefVersionId,
    mode: parsedMode.data,
    format: parsedFormat.data,
    filename: exportRow.filename,
    mimeType: exportRow.mimeType === "text/plain" ? "text/plain" : "text/markdown",
    content: exportRow.content,
    createdAt: exportRow.createdAt.toISOString(),
  };

  return NextResponse.json(ArtifactExportResponseSchema.parse(response));
}

