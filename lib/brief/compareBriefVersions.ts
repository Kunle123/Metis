import type { BriefArtifact, BriefMode } from "@metis/shared/briefVersion";
import { CompareSummarySchema, type CompareSummary } from "@metis/shared/compare";

const EXEC_SUMMARY_BLOCK_LABEL = "Executive summary";

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

function toComparableLines(body: string, maxLines = 12) {
  return body
    .split("\n")
    .map((l) => normalizeText(l.replace(/^[-*•]\s+/, "")))
    .filter(Boolean)
    .slice(0, maxLines);
}

/** Full brief: same cohorts as before (deterministic excerpt from selected full sections). */
function summaryLinesFromFullArtifact(artifact: BriefArtifact) {
  const execSummary = artifact.full.sections.find((s) => s.id === "executive-summary")?.body ?? "";
  const confirmedVsUnclear = artifact.full.sections.find((s) => s.id === "confirmed-vs-unclear")?.body ?? "";
  const recommended = artifact.full.sections.find((s) => s.id === "recommended-actions")?.body ?? "";

  return {
    facts: [...toComparableLines(execSummary), ...toComparableLines(confirmedVsUnclear)],
    recommendations: toComparableLines(recommended),
  };
}

function compareFullBrief(from: BriefArtifact, to: BriefArtifact): CompareSummary {
  const fromLines = summaryLinesFromFullArtifact(from);
  const toLines = summaryLinesFromFullArtifact(to);

  const newFacts = diffFacts(fromLines.facts, toLines.facts);
  const changedRecs = diffFacts(fromLines.recommendations, toLines.recommendations);

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

function blocksByLabel(artifact: BriefArtifact): Map<string, string> {
  const m = new Map<string, string>();
  for (const b of artifact.executive.blocks) {
    m.set(b.label, b.body);
  }
  return m;
}

function normalizedImmediateActions(actions: string[]) {
  return actions
    .map((a) => normalizeText(a.replace(/^[-*•]\s+/, "")))
    .filter((line) => line.length > 0);
}

/** Executive brief: blocks by label + immediate actions (does not read full sections). */
function compareExecutiveBrief(from: BriefArtifact, to: BriefArtifact): CompareSummary {
  const fromMap = blocksByLabel(from);
  const toMap = blocksByLabel(to);

  const fromExecBody = fromMap.get(EXEC_SUMMARY_BLOCK_LABEL) ?? "";
  const toExecBody = toMap.get(EXEC_SUMMARY_BLOCK_LABEL) ?? "";
  const executiveSummaryAdds = diffFacts(toComparableLines(fromExecBody, 24), toComparableLines(toExecBody, 24));

  const otherBlockChanges: string[] = [];

  if (fromMap.has(EXEC_SUMMARY_BLOCK_LABEL) && !toMap.has(EXEC_SUMMARY_BLOCK_LABEL)) {
    otherBlockChanges.push("Executive summary: section removed in newer version");
  }

  const allLabels = new Set<string>([...fromMap.keys(), ...toMap.keys()]);
  allLabels.delete(EXEC_SUMMARY_BLOCK_LABEL);

  for (const label of [...allLabels].sort()) {
    const bf = fromMap.get(label);
    const bt = toMap.get(label);
    if (bf === undefined && bt !== undefined) {
      const lines = toComparableLines(bt, 36);
      if (lines.length) {
        for (const line of lines) otherBlockChanges.push(`${label}: ${line}`);
      } else if (bt.trim()) {
        otherBlockChanges.push(`${label}: (section added)`);
      }
    } else if (bf !== undefined && bt === undefined) {
      otherBlockChanges.push(`${label}: section removed in newer version`);
    } else if (bf !== undefined && bt !== undefined) {
      for (const line of diffFacts(toComparableLines(bf, 36), toComparableLines(bt, 36))) {
        otherBlockChanges.push(`${label}: ${line}`);
      }
    }
  }

  const actionAdds = diffFacts(
    normalizedImmediateActions(from.executive.immediateActions),
    normalizedImmediateActions(to.executive.immediateActions),
  );

  const summary: CompareSummary = {
    groups: [
      { id: "new_facts", items: executiveSummaryAdds.slice(0, 6) },
      { id: "changed_assumptions", items: otherBlockChanges.slice(0, 8) },
      { id: "resolved_uncertainties", items: [] },
      { id: "changed_recommendations", items: actionAdds.slice(0, 6) },
    ],
    readinessMovement: [],
  };

  return CompareSummarySchema.parse(summary);
}

export function compareBriefArtifacts(from: BriefArtifact, to: BriefArtifact, mode: BriefMode): CompareSummary {
  if (mode === "executive") {
    return compareExecutiveBrief(from, to);
  }
  return compareFullBrief(from, to);
}
