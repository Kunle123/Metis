import type { Prisma } from "@prisma/client";

import { prismaWhereInternalInputsVisibleToViewer } from "@/lib/internalInputs/internalObservationVisibility";
import type { ObservationViewer } from "@/lib/internalInputs/internalObservationVisibility";

/** Ensures IDs exist on the issue and restricted observations are only linked when visible to actor. */
export async function validateClaimEvidenceTargets(
  tx: Prisma.TransactionClient,
  issueId: string,
  viewer: ObservationViewer,
  sourceIds: string[],
  gapIds: string[],
  internalInputIds: string[],
): Promise<{ ok: false; message: string } | { ok: true }> {
  const sIds = [...new Set(sourceIds)];
  const gIds = [...new Set(gapIds)];
  const iIds = [...new Set(internalInputIds)];

  if (sIds.length) {
    const n = await tx.source.count({ where: { issueId, id: { in: sIds } } });
    if (n !== sIds.length) return { ok: false, message: "One or more sources are invalid for this issue." };
  }
  if (gIds.length) {
    const n = await tx.gap.count({ where: { issueId, id: { in: gIds } } });
    if (n !== gIds.length) return { ok: false, message: "One or more open questions are invalid for this issue." };
  }

  if (iIds.length) {
    const visibleClause = prismaWhereInternalInputsVisibleToViewer(issueId, viewer);
    const visible = await tx.internalInput.findMany({
      where: { AND: [{ id: { in: iIds } }, visibleClause] },
      select: { id: true },
    });
    if (visible.length !== iIds.length) {
      return { ok: false, message: "One or more observations are restricted or invalid for this issue." };
    }
  }

  return { ok: true };
}
