import type { BriefAlternateWordingTarget, BriefArtifact } from "@metis/shared/briefVersion";

const EXECUTIVE_SUMMARY_ALT: BriefAlternateWordingTarget = {
  mode: "executive",
  kind: "block",
  id: "Executive summary",
};

function targetsMatch(a: BriefAlternateWordingTarget, b: BriefAlternateWordingTarget) {
  return a.mode === b.mode && a.kind === b.kind && a.id === b.id;
}

/**
 * Replace or insert succeeded alternate wording for Executive brief Executive summary block (no duplicates).
 */
export function upsertExecutiveExecutiveSummaryAlternateSucceeded(
  artifact: BriefArtifact,
  params: {
    aiAlternateBody: string;
    attemptedAtIso: string;
    limitations?: string;
    deterministicFingerprint?: string;
  },
): BriefArtifact {
  const newItem = {
    target: EXECUTIVE_SUMMARY_ALT,
    status: "succeeded" as const,
    attemptedAtIso: params.attemptedAtIso.trim(),
    aiAlternateBody: params.aiAlternateBody.trim(),
    ...(params.limitations?.trim() ? { limitations: params.limitations.trim() } : {}),
    ...(params.deterministicFingerprint?.trim() ? { deterministicFingerprint: params.deterministicFingerprint.trim() } : {}),
  };

  const items = (artifact.alternateWording?.items ?? []).filter(
    (i) => !targetsMatch(i.target, EXECUTIVE_SUMMARY_ALT),
  );
  items.push(newItem);

  return {
    ...artifact,
    alternateWording: { items },
  };
}
