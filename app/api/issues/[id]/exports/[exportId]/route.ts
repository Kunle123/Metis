import { NextResponse } from "next/server";

import { BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema } from "@metis/shared/export";
import { prisma } from "@/lib/db/prisma";
import { artifactExportToApiResponse } from "@/lib/export/artifactExportWire";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; exportId: string }> }) {
  const { id: issueId, exportId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  const exportRow = await prisma.artifactExport.findUnique({ where: { id: exportId } });
  if (!exportRow || exportRow.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedMode = BriefModeSchema.safeParse(exportRow.mode);
  const parsedFormat = ExportFormatSchema.safeParse(exportRow.format);
  if (!parsedMode.success || !parsedFormat.success) {
    return NextResponse.json({ error: "Invalid stored export" }, { status: 500 });
  }

  return NextResponse.json(artifactExportToApiResponse(exportRow));
}

