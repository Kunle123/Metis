import type { BriefArtifact } from "@metis/shared/briefVersion";

import { generateBriefFromIssue, type BriefGenerationInput } from "./generateBriefFromIssue";

/**
 * One issue-record snapshot → one artifact containing both Full sections and Executive blocks.
 * Full and Executive layouts differ by design; both are generated from the same inputs in one pass.
 */
export function buildPairedBriefArtifact(input: BriefGenerationInput): BriefArtifact {
  const full = generateBriefFromIssue(input, "full");
  const executive = generateBriefFromIssue(input, "executive");

  return {
    metadata: full.metadata,
    lede: executive.lede,
    full: full.full,
    executive: executive.executive,
  };
}
