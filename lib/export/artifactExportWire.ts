import type { ArtifactExport } from "@prisma/client";

import { ArtifactExportResponseSchema, type ArtifactExportResponse } from "@metis/shared/circulation";
import { BriefModeSchema } from "@metis/shared/briefVersion";
import { ExportFormatSchema, type ExportFormat, type ExportOutputType } from "@metis/shared/export";

import { coerceMessageApprovalStatus } from "@/lib/approvals/coerceMessageApprovalStatus";

export function resolveOutputTypeForStoredExport(format: ExportFormat, mimeType: string): ExportOutputType {
  if (format === "email-ready") return "plain";
  if (mimeType === "text/html") return "html";
  return "markdown";
}

export function artifactExportToApiResponse(
  row: ArtifactExport,
  outputType?: ExportOutputType,
): ArtifactExportResponse {
  const parsedMode = BriefModeSchema.parse(row.mode);
  const parsedFormat = ExportFormatSchema.parse(row.format);
  const ot =
    outputType ?? resolveOutputTypeForStoredExport(parsedFormat, row.mimeType);

  const mimeTypeParsed =
    row.mimeType === "text/plain" || row.mimeType === "text/html" || row.mimeType === "text/markdown"
      ? row.mimeType
      : ("text/markdown" as const);

  return ArtifactExportResponseSchema.parse({
    exportId: row.id,
    issueId: row.issueId,
    briefVersionId: row.briefVersionId,
    mode: parsedMode,
    format: parsedFormat,
    outputType: ot,
    filename: row.filename,
    mimeType: mimeTypeParsed,
    content: row.content,
    approvalStatus: coerceMessageApprovalStatus(row.approvalStatus),
    approvalUpdatedAt: row.approvalUpdatedAt?.toISOString() ?? null,
    approvalUpdatedByUserId: row.approvalUpdatedByUserId ?? null,
    createdAt: row.createdAt.toISOString(),
  });
}
