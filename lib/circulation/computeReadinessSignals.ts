import type { BriefArtifact } from "@metis/shared/briefVersion";

export type ReadinessSignals = {
  openGapsCount: number;
  needsValidationSections: number;
  unclearSections: number;
};

export function computeReadinessSignals({
  openGapsCount,
  artifact,
}: {
  openGapsCount: number;
  artifact: BriefArtifact;
}): ReadinessSignals {
  const needsValidationSections = artifact.full.sections.filter((s) => s.confidence === "Needs validation").length;
  const unclearSections = artifact.full.sections.filter((s) => s.confidence === "Unclear").length;

  return {
    openGapsCount,
    needsValidationSections,
    unclearSections,
  };
}

