import type { BriefArtifact } from "@metis/shared/briefVersion";
import { CompareSummarySchema, type CompareSummary } from "@metis/shared/compare";

function normalizeText(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function asSet(items: string[]) {
  return new Set(items.map((i) => normalizeText(i)).filter((i) => i.length > 0));
}

function diffFacts(fromItems: string[], toItems: string[]) {
  const from = asSet(fromItems);
  const to = asSet(toItems);
  const added: string[] = [];
  for (const item of to) if (!from.has(item)) added.push(item);
  return added;
}

function summaryLinesFromArtifact(artifact: BriefArtifact) {
  const execSummary = artifact.full.sections.find((s) => s.id === "executive-summary")?.body ?? "";
  const confirmedVsUnclear = artifact.full.sections.find((s) => s.id === "confirmed-vs-unclear")?.body ?? "";
  const recommended = artifact.full.sections.find((s) => s.id === "recommended-actions")?.body ?? "";

  const toLines = (s: string) =>
    s
      .split("\n")
      .map((l) => normalizeText(l.replace(/^[-*•]\s+/, "")))
      .filter(Boolean)
      .slice(0, 12);

  return {
    facts: [...toLines(execSummary), ...toLines(confirmedVsUnclear)],
    recommendations: toLines(recommended),
  };
}

export function compareBriefArtifacts(from: BriefArtifact, to: BriefArtifact): CompareSummary {
  const fromLines = summaryLinesFromArtifact(from);
  const toLines = summaryLinesFromArtifact(to);

  const newFacts = diffFacts(fromLines.facts, toLines.facts);
  const changedRecs = diffFacts(fromLines.recommendations, toLines.recommendations);

  // Keep durable semantic structure; avoid UI-specific copy in stored summary.
  const summary: CompareSummary = {
    groups: [
      { id: "new_facts", items: newFacts.slice(0, 6) },
      { id: "changed_assumptions", items: [] },
      { id: "resolved_uncertainties", items: [] },
      { id: "changed_recommendations", items: changedRecs.slice(0, 6) },
    ],
    readinessMovement: [],
  };

  return CompareSummarySchema.parse(summary);
}

