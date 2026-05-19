import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { BriefArtifactSchema } from "@metis/shared/briefVersion";
import { prisma } from "@/lib/db/prisma";
import { buildBriefSynthesisInput } from "@/lib/brief/buildBriefSynthesisInput";
import { upsertExecutiveExecutiveSummaryAlternateSucceeded } from "@/lib/brief/upsertExecutiveSummaryAlternate";
import { evaluateExecutivePolishedBodyForSave } from "@/lib/ai/synthesizeBrief";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";

const PolishSaveRequestSchema = z.object({
  mode: z.string(),
  scope: z.string(),
  briefVersionId: z.string().uuid(),
  polishedBody: z.string(),
  attemptedAtIso: z.string().optional(),
  limitations: z.string().optional(),
});

function resolveAttemptedAtIso(raw?: string | null): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return new Date().toISOString();
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return new Date().toISOString();
  return new Date(ms).toISOString();
}

function fingerprintDeterministicExecutiveBody(body: string): string {
  return createHash("sha256").update(body.trim(), "utf8").digest("hex").slice(0, 48);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const parsedBody = PolishSaveRequestSchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, message: "Invalid request body.", issues: parsedBody.error.issues },
      { status: 400 },
    );
  }

  if (parsedBody.data.mode !== "executive" || parsedBody.data.scope !== "executive-summary") {
    return NextResponse.json(
      { success: false, message: "Only executive brief and executive-summary scope are supported for saving polished wording." },
      { status: 400 },
    );
  }

  const issue = gated.issue;

  const latestExecutive = await prisma.briefVersion.findFirst({
    where: { issueId, mode: "executive" },
    orderBy: { createdAt: "desc" },
  });

  if (!latestExecutive) {
    return NextResponse.json({ success: false, message: "No stored executive brief found for this issue." }, { status: 404 });
  }

  if (latestExecutive.id !== parsedBody.data.briefVersionId) {
    return NextResponse.json(
      {
        success: false,
        code: "stale_revision",
        message:
          "This revision is no longer the current executive brief for this issue. Regenerate the brief or open the latest revision before saving.",
      },
      { status: 409 },
    );
  }

  const briefVersion = latestExecutive;

  const artifactParsed = BriefArtifactSchema.safeParse(briefVersion.artifact);
  if (!artifactParsed.success) {
    return NextResponse.json({ success: false, message: "Stored brief artifact could not be read." }, { status: 500 });
  }

  const execBlock = artifactParsed.data.executive.blocks.find((b) => b.label.trim() === "Executive summary");
  if (!execBlock?.body?.trim()) {
    return NextResponse.json(
      { success: false, message: "This executive brief has no Executive summary block." },
      { status: 404 },
    );
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

  const safety = evaluateExecutivePolishedBodyForSave(synthesisInput, parsedBody.data.polishedBody);
  if (!safety.ok) {
    return NextResponse.json({ success: false, message: safety.message }, { status: 400 });
  }

  const attemptedAtIso = resolveAttemptedAtIso(parsedBody.data.attemptedAtIso);
  const limitations = parsedBody.data.limitations;

  const nextArtifact = upsertExecutiveExecutiveSummaryAlternateSucceeded(artifactParsed.data, {
    aiAlternateBody: parsedBody.data.polishedBody.trim(),
    attemptedAtIso,
    ...(limitations !== undefined && limitations.trim() ? { limitations: limitations.trim() } : {}),
    deterministicFingerprint: fingerprintDeterministicExecutiveBody(execBlock.body),
  });

  const validated = BriefArtifactSchema.safeParse(nextArtifact);
  if (!validated.success) {
    return NextResponse.json(
      { success: false, message: "Alternate wording could not be merged into the stored artifact." },
      { status: 500 },
    );
  }

  await prisma.$transaction([
    prisma.briefVersion.update({
      where: { id: briefVersion.id },
      data: { artifact: validated.data as object },
    }),
    prisma.briefVersion.updateMany({
      where: {
        issueId,
        versionNumber: briefVersion.versionNumber,
        mode: "full",
      },
      data: { artifact: validated.data as object },
    }),
  ]);

  return NextResponse.json({
    success: true,
    briefVersionId: briefVersion.id,
    attemptedAtIso,
  });
}
