import type { DashboardSnapshot } from "./getDashboardSnapshot";

export type OperationalSnapshotMetric = {
  label: string;
  value: string;
  detail: string;
};

/**
 * Top-of-page snapshot cards rendered in MetisShell.
 * One short helper line per card; full context lives in tooltips / dashboard copy below.
 */
export function buildOperationalSnapshotMetrics(snapshot: DashboardSnapshot): OperationalSnapshotMetric[] {
  const { aggregates, issues, workspacePulse } = snapshot;
  const issuesWithAnyBriefStored = issues.filter((i) => i.hasFullBrief || i.hasExecutiveBrief).length;

  const activeDetail =
    aggregates.totalIssues === 0
      ? "Add your first issue"
      : [
          `${aggregates.issuesWithOpenQuestions} with open questions`,
          aggregates.issuesWithNoSources > 0 ? `${aggregates.issuesWithNoSources} need sources` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const briefsDetail =
    issuesWithAnyBriefStored === 0 ? "None stored yet" : `${aggregates.issuesNeedingBriefRegeneration} may need refresh`;

  const oqDetail =
    aggregates.totalIssues === 0 ? "—" : `${workspacePulse.criticalOpenGapsInWorkspace} critical`;

  const exportsDetail =
    workspacePulse.totalStoredExportPackages === 0
      ? "No packages yet"
      : `${aggregates.issuesWithExportedPackage} issues exported`;

  return [
    { label: "Active issues", value: String(aggregates.totalIssues), detail: activeDetail },
    { label: "Issues with briefs", value: String(issuesWithAnyBriefStored), detail: briefsDetail },
    { label: "Open questions", value: String(workspacePulse.totalTrackedOpenQuestionSlots), detail: oqDetail },
    { label: "Saved exports", value: String(workspacePulse.totalStoredExportPackages), detail: exportsDetail },
  ];
}
