import type { BriefArtifact } from "@metis/shared/briefVersion";
import type { Claim, Gap, InternalInput, Issue, Source } from "@prisma/client";

import { synthesizeBriefAlternateWording, synthesizeBriefExecutiveSummary } from "@/lib/ai/synthesizeBrief";

import { buildBriefSynthesisInput } from "./buildBriefSynthesisInput";

type EnrichContext = {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
  claims: Claim[];
};

/** Optional AI alternate wording for Full executive summary and Executive summary block (same artifact). */
export async function enrichBriefArtifactWithAi(
  artifactDeterministic: BriefArtifact,
  ctx: EnrichContext,
): Promise<BriefArtifact> {
  const attemptedAtIso = new Date().toISOString();
  const items: NonNullable<BriefArtifact["alternateWording"]>["items"] = [];

  const synthesisInputBase = {
    issue: ctx.issue,
    sources: ctx.sources,
    gaps: ctx.gaps,
    internalInputs: ctx.internalInputs,
    claims: ctx.claims,
  };

  const fullExec = artifactDeterministic.full.sections.find((s) => s.id === "executive-summary");
  let executiveSummarySynthesis = artifactDeterministic.full.executiveSummarySynthesis;

  if (fullExec?.body?.trim()) {
    const synthesisInput = buildBriefSynthesisInput({
      ...synthesisInputBase,
      deterministicExecutiveSummaryBody: fullExec.body,
    });
    const rewrite = await synthesizeBriefExecutiveSummary(synthesisInput);
    const fullTarget = { mode: "full" as const, kind: "section" as const, id: "executive-summary" };

    if (rewrite?.rewrite?.trim()) {
      items.push({
        target: fullTarget,
        status: "succeeded",
        attemptedAtIso,
        aiAlternateBody: rewrite.rewrite,
        ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
      });
      executiveSummarySynthesis = {
        status: "succeeded",
        attemptedAtIso,
        aiEnhancedBody: rewrite.rewrite,
        ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
      };
    } else {
      items.push({ target: fullTarget, status: "failed", attemptedAtIso });
      executiveSummarySynthesis = { status: "failed", attemptedAtIso };
    }
  }

  const execBlock = artifactDeterministic.executive.blocks.find((b) => b.label.trim() === "Executive summary");
  if (execBlock?.body?.trim()) {
    const synthesisInput = buildBriefSynthesisInput({
      ...synthesisInputBase,
      deterministicExecutiveSummaryBody: execBlock.body,
    });
    const rewrite = await synthesizeBriefAlternateWording({
      input: synthesisInput,
      targetLabel: 'Executive brief “Executive summary” block',
    });
    const execTarget = { mode: "executive" as const, kind: "block" as const, id: "Executive summary" };

    if (rewrite?.rewrite?.trim()) {
      items.push({
        target: execTarget,
        status: "succeeded",
        attemptedAtIso,
        aiAlternateBody: rewrite.rewrite,
        ...(rewrite.limitations?.trim() ? { limitations: rewrite.limitations.trim() } : {}),
      });
    } else {
      items.push({ target: execTarget, status: "failed", attemptedAtIso });
    }
  }

  if (!items.length) return artifactDeterministic;

  const updated: BriefArtifact = {
    ...artifactDeterministic,
    alternateWording: { items },
    full: {
      ...artifactDeterministic.full,
      ...(executiveSummarySynthesis ? { executiveSummarySynthesis } : {}),
    },
  };

  return updated;
}
