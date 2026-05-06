import type {
  BriefAlternateWordingItem,
  BriefAlternateWordingTarget,
  BriefArtifact,
} from "@metis/shared/briefVersion";

export type NormalizedAlternateWording =
  | {
      status: "succeeded";
      attemptedAtIso: string;
      aiAlternateBody: string;
      limitations?: string;
      deterministicFingerprint?: string;
    }
  | {
      status: "failed";
      attemptedAtIso: string;
      limitations?: string;
      deterministicFingerprint?: string;
    }
  | null;

function matchTarget(a: BriefAlternateWordingTarget, b: BriefAlternateWordingTarget) {
  return a.mode === b.mode && a.kind === b.kind && a.id === b.id;
}

function normalizeItem(item: BriefAlternateWordingItem): NormalizedAlternateWording {
  if (item.status === "succeeded") {
    return {
      status: "succeeded",
      attemptedAtIso: item.attemptedAtIso,
      aiAlternateBody: item.aiAlternateBody,
      ...(item.limitations?.trim() ? { limitations: item.limitations.trim() } : {}),
      ...(item.deterministicFingerprint?.trim() ? { deterministicFingerprint: item.deterministicFingerprint.trim() } : {}),
    };
  }
  return {
    status: "failed",
    attemptedAtIso: item.attemptedAtIso,
    ...(item.limitations?.trim() ? { limitations: item.limitations.trim() } : {}),
    ...(item.deterministicFingerprint?.trim() ? { deterministicFingerprint: item.deterministicFingerprint.trim() } : {}),
  };
}

/**
 * Prefer unified `artifact.alternateWording.items`.
 * Back-compat: if requesting the Full `executive-summary` section and no unified item exists,
 * map legacy `artifact.full.executiveSummarySynthesis` into the unified shape.
 */
export function getAlternateWordingForTarget(
  artifact: BriefArtifact | null | undefined,
  target: BriefAlternateWordingTarget,
): NormalizedAlternateWording {
  if (!artifact) return null;

  const items = artifact.alternateWording?.items ?? [];
  const found = items.find((i) => matchTarget(i.target, target));
  if (found) return normalizeItem(found);

  const isLegacyFullExec =
    target.mode === "full" && target.kind === "section" && target.id === "executive-summary";
  if (!isLegacyFullExec) return null;

  const legacy = artifact.full.executiveSummarySynthesis;
  if (!legacy) return null;

  if (legacy.status === "succeeded") {
    return {
      status: "succeeded",
      attemptedAtIso: legacy.attemptedAtIso,
      aiAlternateBody: legacy.aiEnhancedBody,
      ...(legacy.limitations?.trim() ? { limitations: legacy.limitations.trim() } : {}),
    };
  }

  return {
    status: "failed",
    attemptedAtIso: legacy.attemptedAtIso,
  };
}

