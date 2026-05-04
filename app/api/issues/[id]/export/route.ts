import { NextResponse } from "next/server";

import { BriefModeSchema, BriefArtifactSchema } from "@metis/shared/briefVersion";
import { CirculationStateSchema } from "@metis/shared/compare";
import {
  ExportFormatSchema,
  ExportOutputTypeSchema,
  ExportPackageResponseSchema,
  type ExportFormat,
  type ExportOutputType,
} from "@metis/shared/export";
import { ArtifactExportResponseSchema, CreateArtifactExportInputSchema } from "@metis/shared/circulation";
import { prisma } from "@/lib/db/prisma";
import { renderExportDeliverable } from "@/lib/export/renderExportPackage";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { requireMutation } from "@/lib/governance/requireMutation";

function exportFileExtensionForMime(mimeType: string) {
  if (mimeType === "text/html") return "html";
  if (mimeType === "text/plain") return "txt";
  return "md";
}

function resolvedOutputTypeForExport(format: ExportFormat, requested: ExportOutputType | undefined): ExportOutputType {
  if (format === "email-ready") return "plain";
  return requested ?? "markdown";
}

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

  const outputRaw = url.searchParams.get("output");
  let requestedOutputType: ExportOutputType | undefined;
  if (outputRaw !== null && outputRaw.trim() !== "") {
    const pOut = ExportOutputTypeSchema.safeParse(outputRaw);
    if (!pOut.success) {
      return NextResponse.json({ error: "Invalid output" }, { status: 400 });
    }
    requestedOutputType = pOut.data;
    if (requestedOutputType === "plain" && parsedFormat.data !== "email-ready") {
      return NextResponse.json({ error: "Plain output applies only to email-ready format" }, { status: 400 });
    }
    if (parsedFormat.data === "email-ready" && requestedOutputType === "html") {
      return NextResponse.json({ error: "HTML output is not available for email-ready format" }, { status: 400 });
    }
  }

  const artifact = BriefArtifactSchema.parse(briefVersion.artifact);
  const ot = resolvedOutputTypeForExport(parsedFormat.data, requestedOutputType);
  const rendered = renderExportDeliverable({
    issue,
    mode: parsedMode.data,
    format: parsedFormat.data,
    artifact,
    outputType: ot,
  });

  const now = new Date();
  const ext = exportFileExtensionForMime(rendered.mimeType);
  const filename = `metis-${issueId}-${parsedFormat.data}-v${briefVersion.versionNumber}.${ext}`;

  const response = {
    issueId,
    briefVersionId: briefVersion.id,
    mode: parsedMode.data,
    format: parsedFormat.data,
    outputType: ot,
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
  const user = await requireMutation(request);
  if (user instanceof NextResponse) return user;

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
    const outputTypeField = form.get("outputType");
    const logEventEventType = form.get("logEvent.eventType");
    const logEventChannel = form.get("logEvent.channel");
    const logEventActorLabel = form.get("logEvent.actorLabel");
    const logEventAudienceLabel = form.get("logEvent.audienceLabel");
    const logEventNote = form.get("logEvent.note");

    body = {
      briefVersionId: typeof briefVersionId === "string" ? briefVersionId : "",
      format: typeof format === "string" ? format : "",
      outputType: typeof outputTypeField === "string" && outputTypeField.trim() !== "" ? outputTypeField : undefined,
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

  const { briefVersionId, format, outputType: outputTypeBody, logEvent } = parsed.data;

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
  const ot = resolvedOutputTypeForExport(format, outputTypeBody);
  const rendered = renderExportDeliverable({ issue, mode: parsedMode.data, format, artifact, outputType: ot });
  const ext = exportFileExtensionForMime(rendered.mimeType);
  const filename = `metis-${issueId}-${format}-v${briefVersion.versionNumber}.${ext}`;

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

    const briefModeLabel = parsedMode.data === "full" ? "Full" : "Executive";
    await writeIssueActivity(tx, {
      issueId,
      kind: IssueActivityKinds.export_created,
      summary: `Export package created from ${briefModeLabel} brief v${briefVersion.versionNumber}`,
      refType: "ArtifactExport",
      refId: exportRow.id,
      actorLabel: user.email ?? null,
    });

    if (logEvent) {
      const event = await tx.circulationEvent.create({
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

      await writeIssueActivity(tx, {
        issueId,
        kind: IssueActivityKinds.circulation_event_created,
        summary: "Circulation event logged",
        refType: "CirculationEvent",
        refId: event.id,
        actorLabel: user.email ?? null,
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
    outputType: ot,
    filename: created.filename,
    mimeType:
      created.mimeType === "text/plain"
        ? ("text/plain" as const)
        : created.mimeType === "text/html"
          ? ("text/html" as const)
          : ("text/markdown" as const),
    content: created.content,
    createdAt: created.createdAt.toISOString(),
  };

  return NextResponse.json(ArtifactExportResponseSchema.parse(response));
}

