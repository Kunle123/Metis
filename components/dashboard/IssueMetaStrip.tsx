export function IssueMetaStrip({
  ownerName,
  audience,
  updatedAt,
}: {
  ownerName: string | null;
  audience: string | null;
  updatedAt: Date;
}) {
  const updatedAtLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(updatedAt);

  return (
    <div className="rounded-[1.35rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_82%,transparent)] p-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Owner</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{ownerName ?? "—"}</p>
        </div>
        <div className="min-w-0 border-t border-[--metis-outline-subtle] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Intake audience note</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{audience ?? "—"}</p>
        </div>
        <div className="min-w-0 border-t border-[--metis-outline-subtle] pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Updated</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{updatedAtLabel}</p>
        </div>
      </div>
    </div>
  );
}
