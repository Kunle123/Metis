/**
 * Collapsible explanatory copy kept off the critical path on phones.
 */
export function DashboardAboutDisclosure() {
  return (
    <details className="group mt-2 rounded-lg border border-[--metis-outline-subtle]/70 bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] text-left">
      <summary className="cursor-pointer select-none px-3 py-2 text-[0.68rem] font-medium text-[--metis-brass-soft] marker:text-[--metis-brass-soft] [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-[--metis-outline-subtle] underline-offset-2 group-open:no-underline">About this dashboard</span>
      </summary>
      <div className="border-t border-[--metis-outline-subtle]/60 px-3 pb-2.5 pt-2 text-[0.65rem] leading-relaxed text-[--metis-paper-muted]">
        <p>
          Your main dashboard for tracking issues and briefing outputs. Rows are sorted by recent activity — use attention signals to decide what to
          work on next.
        </p>
        <p className="mt-2 text-[--metis-text-tertiary]">
          Search and filters — coming soon. Use shortcuts from issue cards (&quot;More actions&quot;) and the Issues workspace for quick jumps.
        </p>
      </div>
    </details>
  );
}
