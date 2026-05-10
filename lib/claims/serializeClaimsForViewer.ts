import type { Claim, Gap, InternalInput, Source } from "@prisma/client";

import type { ClaimStatus } from "@metis/shared/claim";

import { formatClaimCode, formatGapCode, formatObservationCode } from "@/lib/issueRecordCodes";
import { internalObservationReadableByViewer } from "@/lib/internalInputs/internalObservationVisibility";
import type { ObservationViewer } from "@/lib/internalInputs/internalObservationVisibility";

import { coerceClaimStatus } from "./coerceClaimStatus";

export type SerializedClaimObservationLink =
  | { kind: "observation"; observationId: string; code: string }
  | { kind: "observation_restricted"; hidden: true };

export type SerializedClaim = {
  id: string;
  issueId: string;
  claimCode: string;
  claimNumber: number;
  text: string;
  status: ClaimStatus;
  notes: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  links: {
    sources: Array<{ sourceId: string; sourceCode: string }>;
    gaps: Array<{ gapId: string; gapLabel: string }>;
    observations: SerializedClaimObservationLink[];
  };
};

type ClaimWithJoins = Claim & {
  sources: Array<{ source: Pick<Source, "id" | "sourceCode"> }>;
  gaps: Array<{ gap: Pick<Gap, "id" | "gapNumber"> }>;
  internalLinks: Array<{ internalInput: Pick<InternalInput, "id" | "observationNumber" | "visibility" | "createdByUserId"> }>;
};

export function serializeClaimForViewer(row: ClaimWithJoins, viewer: ObservationViewer): SerializedClaim {
  const obsLinks: SerializedClaimObservationLink[] = [];
  for (const link of row.internalLinks) {
    const ob = link.internalInput;
    if (
      internalObservationReadableByViewer(viewer, {
        visibility: ob.visibility,
        createdByUserId: ob.createdByUserId,
      })
    ) {
      const code = formatObservationCode(ob.observationNumber) ?? "OBS";
      obsLinks.push({ kind: "observation", observationId: ob.id, code });
    } else {
      obsLinks.push({ kind: "observation_restricted", hidden: true });
    }
  }

  const code = formatClaimCode(row.claimNumber) ?? `CLM-${row.claimNumber}`;

  return {
    id: row.id,
    issueId: row.issueId,
    claimNumber: row.claimNumber,
    claimCode: code,
    text: row.text,
    status: coerceClaimStatus(row.status),
    notes: row.notes ?? null,
    createdByUserId: row.createdByUserId ?? null,
    updatedByUserId: row.updatedByUserId ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    links: {
      sources: row.sources.map((x) => ({
        sourceId: x.source.id,
        sourceCode: x.source.sourceCode,
      })),
      gaps: row.gaps.map((x) => ({
        gapId: x.gap.id,
        gapLabel: formatGapCode(x.gap.gapNumber) ?? "Open question",
      })),
      observations: obsLinks,
    },
  };
}
