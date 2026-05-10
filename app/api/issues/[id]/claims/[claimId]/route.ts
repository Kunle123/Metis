import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { PatchClaimBodySchema } from "@metis/shared/claim";
import { claimStatusDisplayLabel } from "@/lib/claims/claimStatusUi";
import { coerceClaimStatus } from "@/lib/claims/coerceClaimStatus";
import { serializeClaimForViewer } from "@/lib/claims/serializeClaimsForViewer";
import { validateClaimEvidenceTargets } from "@/lib/claims/validateEvidenceLinkTargets";
import { prisma } from "@/lib/db/prisma";
import { internalObservationReadableByViewer } from "@/lib/internalInputs/internalObservationVisibility";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; claimId: string }> },
) {
  const { id: issueId, claimId } = await params;

  const gated = await requireActiveOrgIssue(request, issueId);
  if (gated instanceof NextResponse) return gated;
  if (!membershipAllowsOrgWrite(gated.ctx.membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const viewer = { membershipRole: gated.ctx.membership.role, userId: gated.ctx.user.id };

  const existing = await prisma.claim.findFirst({
    where: { id: claimId, issueId },
    include: claimInclude,
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = PatchClaimBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const patch = parsed.data;

  const mergedInternalPatchIds =
    patch.internalInputIds === undefined
      ? undefined
      : [
          ...new Set([
            ...patch.internalInputIds,
            ...existing.internalLinks
              .filter(
                (link) =>
                  !internalObservationReadableByViewer(viewer, {
                    visibility: link.internalInput.visibility,
                    createdByUserId: link.internalInput.createdByUserId,
                  }),
              )
              .map((l) => l.internalInputId),
          ]),
        ];

  const touchesLinks =
    patch.sourceIds !== undefined || patch.gapIds !== undefined || patch.internalInputIds !== undefined;
  const touchesMeta = patch.text !== undefined || patch.notes !== undefined || touchesLinks;

  let nextStatus = coerceClaimStatus(existing.status);
  if (patch.status !== undefined) nextStatus = patch.status;

  const statusOnly =
    patch.status !== undefined &&
    !touchesMeta &&
    patch.status !== coerceClaimStatus(existing.status);

  const sourceIdsForValidate = [...new Set(patch.sourceIds ?? existing.sources.map((s) => s.sourceId))];
  const gapIdsForValidate = [...new Set(patch.gapIds ?? existing.gaps.map((g) => g.gapId))];
  const internalIdsForValidate = [
    ...new Set(mergedInternalPatchIds ?? existing.internalLinks.map((l) => l.internalInputId)),
  ];

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const chk = await validateClaimEvidenceTargets(tx, issueId, viewer, sourceIdsForValidate, gapIdsForValidate, internalIdsForValidate);
      if (!chk.ok) throw new Error(chk.message);

      const updateData = {
        ...(patch.text !== undefined ? { text: patch.text.trim() } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes?.trim() ? patch.notes.trim() : null } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        updatedByUserId: gated.ctx.user.id,
      };

      await tx.claim.update({
        where: { id: claimId },
        data: updateData,
      });

      if (touchesLinks) {
        await tx.claimSource.deleteMany({ where: { claimId } });
        await tx.claimGap.deleteMany({ where: { claimId } });
        await tx.claimInternalInput.deleteMany({ where: { claimId } });

        const sWrite = patch.sourceIds !== undefined ? [...new Set(patch.sourceIds)] : existing.sources.map((s) => s.sourceId);
        const gWrite = patch.gapIds !== undefined ? [...new Set(patch.gapIds)] : existing.gaps.map((g) => g.gapId);
        /** Writer cannot see restricted observations; re-attach preserved links so edits do not drop them. */
        const iWrite =
          mergedInternalPatchIds !== undefined
            ? [...new Set(mergedInternalPatchIds)]
            : existing.internalLinks.map((l) => l.internalInputId);

        if (sWrite.length) {
          await tx.claimSource.createMany({ data: sWrite.map((sourceId) => ({ claimId, sourceId })) });
        }
        if (gWrite.length) {
          await tx.claimGap.createMany({ data: gWrite.map((gapId) => ({ claimId, gapId })) });
        }
        if (iWrite.length) {
          await tx.claimInternalInput.createMany({
            data: iWrite.map((internalInputId) => ({ claimId, internalInputId })),
          });
        }
      }

      const code = formatClaimCode(existing.claimNumber) ?? "";

      if (statusOnly) {
        await writeIssueActivity(tx, {
          issueId,
          kind: IssueActivityKinds.claim_status_updated,
          summary: `${code} set to ${claimStatusDisplayLabel(nextStatus)}`,
          refType: "Claim",
          refId: claimId,
          actorLabel: gated.ctx.user.email ?? null,
        });
      } else {
        await writeIssueActivity(tx, {
          issueId,
          kind: IssueActivityKinds.claim_updated,
          summary: `${code} updated`,
          refType: "Claim",
          refId: claimId,
          actorLabel: gated.ctx.user.email ?? null,
        });
      }

      return tx.claim.findUniqueOrThrow({ where: { id: claimId }, include: claimInclude });
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Transaction failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  revalidatePath(`/issues/${issueId}`);
  revalidatePath(`/issues/${issueId}/claims`);

  return NextResponse.json({ claim: serializeClaimForViewer(result, viewer) });
}
