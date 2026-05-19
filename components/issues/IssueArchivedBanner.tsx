export function IssueArchivedBanner() {
  return (
    <div
      role="status"
      className="rounded-[1.25rem] border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_42%,transparent)] px-5 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)]"
    >
      <p className="text-sm font-medium text-[--metis-paper]">Archived issue</p>
      <p className="mt-1.5 text-sm leading-6 text-[--metis-paper-muted]">
        This record is retained for reference. Reopen it before adding new material.
      </p>
    </div>
  );
}
