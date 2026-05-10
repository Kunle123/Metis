import { NextResponse } from "next/server";
import { z } from "zod";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { buildBriefSynthesisInput } from "@/lib/brief/buildBriefSynthesisInput";
import { executeBriefAlternateWordingSynthesis, type BriefAlternateWordingSynthesisOutcome } from "@/lib/ai/synthesizeBrief";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

const PolishPreviewRequestSchema = z.object({
  mode: z.string(),
  scope: z.string(),
  briefVersionId: z.string().uuid().optional(),
});

function messageForSynthesisErrorCode(error: Extract<BriefAlternateWordingSynthesisOutcome, { status: "error" }>["error"]): string {
  switch (error) {
    case "missing_api_key":
      return "Polish preview is unavailable: OpenAI API key is not configured.";
    case "openai_http":
      return "Polish preview could not reach the synthesis service. Try again later.";
    case "empty_response":
    case "parse_failed":
    case "invalid_payload":
      return "Polish preview could not parse a valid rewrite from the synthesis service.";
    case "safety_rejected":
      return "Polished wording did not pass safety checks. The stored executive summary is unchanged.";
    default:
      return "Polish preview is temporarily unavailable.";
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ success: false, code: "forbidden", message: "Forbidden." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = PolishPreviewRequestSchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, code: "invalid_request", message: "Invalid request body.", issues: parsedBody.error.issues },
      { status: 400 },
    );
  }

  if (parsedBody.data.mode !== "executive" || parsedBody.data.scope !== "executive-summary") {
    return NextResponse.json(
      { success: false, code: "unsupported_scope", message: "Only executive brief and executive-summary scope are supported for polish preview." },
      { status: 400 },
    );
  }

  const issue = gated.issue;

  const briefVersion = parsedBody.data.briefVersionId
    ? await prisma.briefVersion.findFirst({
        where: { id: parsedBody.data.briefVersionId, issueId, mode: "executive" },
      })
    : await prisma.briefVersion.findFirst({
        where: { issueId, mode: "executive" },
        orderBy: { createdAt: "desc" },
      });

  if (!briefVersion) {
    return NextResponse.json(
      { success: false, code: "no_brief", message: "No stored executive brief found for this issue." },
      { status: 404 },
    );
  }

  const artifactParsed = BriefArtifactSchema.safeParse(briefVersion.artifact);
  if (!artifactParsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_artifact", message: "Stored brief artifact could not be read." },
      { status: 500 },
    );
  }

  const execBlock = artifactParsed.data.executive.blocks.find((b) => b.label.trim() === "Executive summary");
  if (!execBlock?.body?.trim()) {
    return NextResponse.json(
      { success: false, code: "no_executive_summary", message: "This executive brief has no Executive summary block to polish." },
      { status: 404 },
    );
  }

  if (process.env.BRIEF_AI_SYNTHESIS_ENABLED !== "true") {
    return NextResponse.json({
      disabled: true,
      message: "Polish preview is unavailable because AI synthesis is disabled.",
    });
  }

  const genViewer = { membershipRole: gated.ctx.membership.role, userId: gated.ctx.user.id };
  const [sources, gaps, internalInputs, claims] = await Promise.all([
    prisma.source.findMany({ where: { issueId }, orderBy: [{ createdAt: "desc" }] }),
    prisma.gap.findMany({ where: { issueId }, orderBy: [{ updatedAt: "desc" }] }),
    prisma.internalInput.findMany({
      where: prismaWhereInternalInputsVisibleToViewer(issueId, genViewer),
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.claim.findMany({ where: { issueId }, orderBy: [{ claimNumber: "asc" }] }),
  ]);

  const synthesisInput = buildBriefSynthesisInput({
    issue,
    sources,
    gaps,
    internalInputs,
    claims,
    deterministicExecutiveSummaryBody: execBlock.body,
  });

  const attemptedAtIso = new Date().toISOString();
  const outcome = await executeBriefAlternateWordingSynthesis({
    input: synthesisInput,
    targetLabel: 'Executive brief “Executive summary” block',
  });

  if (outcome.status === "success") {
    return NextResponse.json({
      success: true,
      polished: outcome.rewrite,
      ...(outcome.limitations?.trim() ? { limitations: outcome.limitations.trim() } : {}),
      attemptedAtIso,
    });
  }

  if (outcome.error === "safety_rejected") {
    return NextResponse.json({
      success: false,
      code: "validation_failed",
      message: messageForSynthesisErrorCode(outcome.error),
    });
  }

  return NextResponse.json({
    success: false,
    code: "synthesis_unavailable",
    message: messageForSynthesisErrorCode(outcome.error),
  });
}
