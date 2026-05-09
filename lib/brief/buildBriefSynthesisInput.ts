import type { Gap, InternalInput, Issue, Source } from "@prisma/client";

import type { BriefSynthesisInput } from "@/lib/ai/synthesizeBrief";
import { rankInternalInputsForIssue, rankOpenGapsForIssue, rankSourcesForIssue } from "@/lib/evidence/rankEvidence";

/**
 * Builds the structured input passed to brief executive-summary synthesis.
 * Mirrors `app/api/issues/[id]/brief-versions/route.ts` so preview uses the same context as generation.
 */
export function buildBriefSynthesisInput(params: {
  issue: Issue;
  sources: Source[];
  gaps: Gap[];
  internalInputs: InternalInput[];
  deterministicExecutiveSummaryBody: string;
}): BriefSynthesisInput {
  const { issue, sources, gaps, internalInputs, deterministicExecutiveSummaryBody } = params;

  const rankedSources = rankSourcesForIssue(sources);
  const rankedOpenGaps = rankOpenGapsForIssue(gaps, { onlyOpen: true });
  const rankedInputsForBrief = rankInternalInputsForIssue(internalInputs, { excludeFromBrief: true });
  const topObservations = rankedInputsForBrief.slice(0, 2).map((i) => ({
    role: i.role,
    name: i.name,
    confidence: i.confidence ?? null,
    linkedSection: i.linkedSection ?? null,
    response: String(i.response ?? "").slice(0, 360),
  }));

  const topSources = rankedSources.slice(0, 2).map((s) => ({
    sourceCode: s.sourceCode,
    tier: s.tier,
    title: s.title,
    linkedSection: s.linkedSection ?? null,
  }));

  const openTracker = rankedOpenGaps
    .slice(0, 5)
    .map((g) => ({
      severity: g.severity ?? null,
      linkedSection: (g as { linkedSection?: string | null }).linkedSection ?? null,
      text: (g.prompt || g.title || "").trim(),
    }))
    .filter((x) => x.text.length);

  const openQuestionsIntake = String(issue.openQuestions ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);

  const audienceNote = String(issue.audience ?? "").trim();
  const audienceContextSummary = audienceNote
    ? `Audience note: ${audienceNote}`
    : "No specific audience note is recorded on the issue.";

  return {
    issue: {
      title: issue.title,
      summary: issue.summary,
      context: issue.context ?? "",
      confirmedFacts: issue.confirmedFacts ?? "",
      openQuestionsIntake,
      audienceContextSummary,
    },
    topTrackerOpenQuestions: openTracker,
    topSources,
    topObservations,
    deterministicExecutiveSummaryBody,
  };
}
