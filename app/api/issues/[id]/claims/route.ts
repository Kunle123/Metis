import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { CreateClaimBodySchema } from "@metis/shared/claim";
import { claimStatusDisplayLabel } from "@/lib/claims/claimStatusUi";
import { coerceClaimStatus } from "@/lib/claims/coerceClaimStatus";
import { serializeClaimForViewer } from "@/lib/claims/serializeClaimsForViewer";
import { validateClaimEvidenceTargets } from "@/lib/claims/validateEvidenceLinkTargets";
import { prisma } from "@/lib/db/prisma";
import { IssueActivityKinds } from "@/lib/issues/activityKinds";
import { writeIssueActivity } from "@/lib/issues/writeIssueActivity";
import { formatClaimCode } from "@/lib/issueRecordCodes";
import { membershipAllowsOrgWrite } from "@/lib/organisations/orgCapabilities";
import { requireActiveOrgIssue } from "@/lib/organisations/requireActiveOrgIssue";

const claimInclude = {
  sources: { include: { source: { select: { id: true, sourceCode: true } } } },
  gaps: { include: { gap: { select: { id: true, gapNumber: true } } } },
  internalLinks: {
    include: { internalInput: { select: { id: true, observationNumber: true, visibility: true, createdByUserId: true } } },
  },
} as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;

  const viewer = { membershipRole: gated.ctx.membership.role, userId: gated.ctx.user.id };

  const rows = await prisma.claim.findMany({
    where: { issueId },
    include: claimInclude,
    orderBy: [{ claimNumber: "asc" }],
  });

  return NextResponse.json({ claims: rows.map((r) => serializeClaimForViewer(r, viewer)) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: issueId } = await params;
  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = CreateClaimBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const status = coerceClaimStatus(parsed.data.status ?? "NeedsValidation");
  const viewer = { membershipRole: gated.ctx.membership.role, userId: gated.ctx.user.id };
  const sourceIds = [...new Set(parsed.data.sourceIds ?? [])];
  const gapIds = [...new Set(parsed.data.gapIds ?? [])];
  const internalInputIds = [...new Set(parsed.data.internalInputIds ?? [])];

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const chk = await validateClaimEvidenceTargets(tx, issueId, viewer, sourceIds, gapIds, internalInputIds);
      if (!chk.ok) throw new Error(chk.message);

      const issueRow = await tx.issue.update({
        where: { id: issueId },
        data: { claimCodeSeq: { increment: 1 } },
        select: { claimCodeSeq: true },
      });
      const claimNumber = issueRow.claimCodeSeq;

      const claim = await tx.claim.create({
        data: {
          issueId,
          claimNumber,
          text: parsed.data.text.trim(),
          status,
          notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
          createdByUserId: gated.ctx.user.id,
          updatedByUserId: gated.ctx.user.id,
        },
      });

      if (sourceIds.length) {
        await tx.claimSource.createMany({
          data: sourceIds.map((sourceId) => ({ claimId: claim.id, sourceId })),
        });
      }
      if (gapIds.length) {
        await tx.claimGap.createMany({
          data: gapIds.map((gapId) => ({ claimId: claim.id, gapId })),
        });
      }
      if (internalInputIds.length) {
        await tx.claimInternalInput.createMany({
          data: internalInputIds.map((internalInputId) => ({ claimId: claim.id, internalInputId })),
        });
      }

      await writeIssueActivity(tx, {
        issueId,
        kind: IssueActivityKinds.claim_created,
        summary: `Claim ${formatClaimCode(claimNumber)} created (${claimStatusDisplayLabel(status)})`,
        refType: "Claim",
        refId: claim.id,
        actorLabel: gated.ctx.user.email ?? null,
      });

      return tx.claim.findUniqueOrThrow({ where: { id: claim.id }, include: claimInclude });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Transaction failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/claims`);

  return NextResponse.json({
    claim: serializeClaimForViewer(created, viewer),
  });
}
