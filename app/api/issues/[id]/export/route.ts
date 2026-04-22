import { NextResponse } from "next/server";

import { BriefModeSchema, BriefArtifactSchema } from "@metis/shared/briefVersion";
import { CirculationStateSchema } from "@metis/shared/compare";
import { ExportFormatSchema, ExportPackageResponseSchema } from "@metis/shared/export";
import { ArtifactExportResponseSchema, CreateArtifactExportInputSchema } from "@metis/shared/circulation";
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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  let body: unknown;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  } else {
    const form = await request.formData();
    const briefVersionId = form.get("briefVersionId");
    const format = form.get("format");
    const logEventEventType = form.get("logEvent.eventType");
    const logEventChannel = form.get("logEvent.channel");
    const logEventActorLabel = form.get("logEvent.actorLabel");
    const logEventAudienceLabel = form.get("logEvent.audienceLabel");
    const logEventNote = form.get("logEvent.note");

    body = {
      briefVersionId: typeof briefVersionId === "string" ? briefVersionId : "",
      format: typeof format === "string" ? format : "",
      logEvent:
        typeof logEventEventType === "string"
          ? {
              eventType: logEventEventType,
              channel: typeof logEventChannel === "string" ? logEventChannel : undefined,
              actorLabel: typeof logEventActorLabel === "string" ? logEventActorLabel : undefined,
              audienceLabel: typeof logEventAudienceLabel === "string" ? logEventAudienceLabel : undefined,
              note: typeof logEventNote === "string" ? logEventNote : undefined,
            }
          : undefined,
    };
  }

  const parsed = CreateArtifactExportInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { briefVersionId, format, logEvent } = parsed.data;

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

  const postureState = CirculationStateSchema.parse(briefVersion.circulationState);
  const artifact = BriefArtifactSchema.parse(briefVersion.artifact);
  const rendered = renderExportPackage({ issue, mode: parsedMode.data, format, artifact });
  const filename = `metis-${issueId}-${format}-v${briefVersion.versionNumber}.${rendered.mimeType === "text/plain" ? "txt" : "md"}`;

  const created = await prisma.$transaction(async (tx) => {
    const exportRow = await tx.artifactExport.create({
      data: {
        issueId,
        briefVersionId: briefVersion.id,
        mode: parsedMode.data,
        format,
        filename,
        mimeType: rendered.mimeType,
        content: rendered.content,
      },
    });

    if (logEvent) {
      await tx.circulationEvent.create({
        data: {
          issueId,
          briefVersionId: briefVersion.id,
          exportId: exportRow.id,
          actorLabel: logEvent.actorLabel ?? null,
          eventType: logEvent.eventType,
          channel: logEvent.channel ?? null,
          audienceLabel: logEvent.audienceLabel ?? null,
          postureState,
          note: logEvent.note ?? null,
        },
      });
    }

    return exportRow;
  });

  const response = {
    exportId: created.id,
    issueId: created.issueId,
    briefVersionId: created.briefVersionId,
    mode: parsedMode.data,
    format,
    filename: created.filename,
    mimeType: created.mimeType === "text/plain" ? "text/plain" : "text/markdown",
    content: created.content,
    createdAt: created.createdAt.toISOString(),
  };

  return NextResponse.json(ArtifactExportResponseSchema.parse(response));
}

