import { NextResponse } from "next/server";

import { ArtifactExportResponseSchema } from "@metis/shared/circulation";
import { BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema, ExportMimeTypeSchema, type ExportFormat, type ExportOutputType } from "@metis/shared/export";
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

  const mimeParsed = ExportMimeTypeSchema.safeParse(exportRow.mimeType);
  const mimeType = mimeParsed.success ? mimeParsed.data : ("text/markdown" as const);

  function outputTypeFromStored(mf: string): ExportOutputType {
    const f = parsedFormat.data as ExportFormat;
    if (f === "email-ready") return "plain";
    if (mf === "text/html") return "html";
    return "markdown";
  }

  const response = {
    exportId: exportRow.id,
    issueId: exportRow.issueId,
    briefVersionId: exportRow.briefVersionId,
    mode: parsedMode.data,
    format: parsedFormat.data,
    outputType: outputTypeFromStored(exportRow.mimeType),
    filename: exportRow.filename,
    mimeType,
    content: exportRow.content,
    createdAt: exportRow.createdAt.toISOString(),
  };

  return NextResponse.json(ArtifactExportResponseSchema.parse(response));
}

