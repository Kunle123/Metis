import { NextResponse } from "next/server";

import { BriefArtifactSchema, BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema } from "@metis/shared/export";
import { prisma } from "@/lib/db/prisma";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { loadExportAuditAppendixPayload } from "@/lib/export/buildExportAuditAppendix";
import { EXPORT_DOCX_MIME, isExportDocxSupported, renderExportPackageDocx } from "@/lib/export/renderExportDocx";

/**
 * Binary DOCX download (beta). Does not create `ArtifactExport` rows or log circulation events.
 * JSON text exports remain on `GET/POST /api/issues/[id]/export`.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  const url = new URL(request.url);

  const briefVersionId = url.searchParams.get("briefVersionId");
  const formatRaw = url.searchParams.get("format");

  const parsedFormat = ExportFormatSchema.safeParse(formatRaw);
  if (!briefVersionId || !parsedFormat.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const format = parsedFormat.data;
  if (!isExportDocxSupported(format)) {
    return NextResponse.json({ error: "DOCX is not available for this format" }, { status: 400 });
  }

  const briefVersion = await prisma.briefVersion.findUnique({ where: { id: briefVersionId } });
  const issue = gated.issue;

  if (!briefVersion || briefVersion.issueId !== issueId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedMode = BriefModeSchema.safeParse(briefVersion.mode);
  if (!parsedMode.success) {
    return NextResponse.json({ error: "Invalid stored mode" }, { status: 500 });
  }

  const artifact = BriefArtifactSchema.parse(briefVersion.artifact);

  const auditAppendix =
    format === "full-issue-brief" ? await loadExportAuditAppendixPayload(issueId) : undefined;

  let buffer: Buffer;
  try {
    buffer = await renderExportPackageDocx({
      issue,
      mode: parsedMode.data,
      format,
      artifact,
      auditAppendix,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Render failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const filename = `metis-${issueId}-${format}-v${briefVersion.versionNumber}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": EXPORT_DOCX_MIME,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
