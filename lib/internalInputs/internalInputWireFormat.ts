import {
  InternalInputSchema,
  InternalObservationVisibilitySchema,
  type InternalInput,
  type InternalObservationVisibility,
} from "@metis/shared/internalInput";

import { normalizeObservationVisibility } from "@/lib/internalInputs/internalObservationVisibility";

const CONFIDENCE_VALUES = new Set(["Confirmed", "Likely", "Unclear", "Needs validation"] as const);

export type InternalInputDbRow = {
  id: string;
  issueId: string;
  observationNumber: number;
  role: string;
  name: string;
  response: string;
  confidence: string;
  excludedFromBrief: boolean;
  linkedSection: string | null;
  visibility: string | null;
  createdByUserId: string | null;
  timestampLabel: string | null;
  createdAt: Date;
};

/** Matches `app/issues/[issueId]/input/page.tsx`: invalid confidence → `Unclear`. */
export function normaliseInternalInputConfidence(value: unknown): "Confirmed" | "Likely" | "Unclear" | "Needs validation" {
  if (typeof value === "string" && CONFIDENCE_VALUES.has(value as any)) {
    return value as "Confirmed" | "Likely" | "Unclear" | "Needs validation";
  }
  return "Unclear";
}

/**
 * Stable JSON shape for API + UI. Returns `null` if the row fails `InternalInputSchema` (skip in lists; treat as data error for singleton GET).
 */
export function internalInputDbRowToWire(row: InternalInputDbRow): InternalInput | null {
  const canonVisibility: InternalObservationVisibility = InternalObservationVisibilitySchema.parse(
    normalizeObservationVisibility(row.visibility),
  );
  const candidate = {
    id: row.id,
    issueId: row.issueId,
    observationNumber: row.observationNumber,
    role: row.role ?? "",
    name: row.name ?? "",
    response: row.response ?? "",
    confidence: normaliseInternalInputConfidence(row.confidence),
    excludedFromBrief: row.excludedFromBrief ?? false,
    linkedSection: row.linkedSection ?? null,
    visibility: canonVisibility,
    createdByUserId: row.createdByUserId ?? null,
    timestampLabel: row.timestampLabel ?? null,
    createdAt: row.createdAt.toISOString(),
  };

  const parsed = InternalInputSchema.safeParse(candidate);
  if (!parsed.success) {
    console.error("Skipping malformed internal input record", { id: row.id, issues: parsed.error.issues });
    return null;
  }
  return parsed.data;
}
