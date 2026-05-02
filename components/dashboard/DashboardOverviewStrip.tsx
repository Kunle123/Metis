import type { DashboardSnapshot } from "@/lib/dashboard/getDashboardSnapshot";

export function DashboardOverviewStrip({ aggregates }: { aggregates: DashboardSnapshot["aggregates"] }) {
  if (aggregates.totalIssues === 0) return null;

  const chips: { key: string; label: string; hint: string }[] = [
    {
      key: "total",
      label: `${aggregates.totalIssues} issue${aggregates.totalIssues === 1 ? "" : "s"}`,
      hint: "Records in this Metis workspace (not live external monitoring).",
    },
    {
      key: "oq",
      label: `${aggregates.issuesWithOpenQuestions} with open questions`,
      hint: "Tracker count on the issue record — review in Open questions.",
    },
    {
      key: "src",
      label: `${aggregates.issuesWithNoSources} with no sources`,
      hint: "Link evidence on the Sources page before hard claims.",
    },
    {
      key: "msg",
      label: `${aggregates.issuesWithMessages} with Messages drafts`,
      hint: "At least one saved message variant exists for the issue.",
    },
    {
      key: "exp",
      label: `${aggregates.issuesWithExportedPackage} exported before`,
      hint: "At least one stored export package — see Prepare output.",
    },
    {
      key: "stale",
      label: `${aggregates.issuesNeedingBriefRegeneration} brief may need refresh`,
      hint: "Stored brief predates the latest issue edit — open Brief to regenerate if needed.",
    },
  ];

  return (
    <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-4 sm:px-6">
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Workspace overview</p>
      <p className="mt-2 text-xs leading-relaxed text-[--metis-paper-muted]">
        Counts are derived from your issue records, sources, open questions, briefs, Messages, and exports — not an AI risk score.
      </p>
      <ul className="mt-4 flex min-w-0 flex-wrap gap-2">
        {chips.map((c) => (
          <li
            key={c.key}
            className="max-w-full rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-left"
            title={c.hint}
          >
            <span className="block text-sm font-medium text-[--metis-paper]">{c.label}</span>
            <span className="mt-0.5 block text-[0.65rem] leading-snug text-[--metis-paper-muted]">{c.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
