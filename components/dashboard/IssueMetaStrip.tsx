export function IssueMetaStrip({
  ownerName,
  audience,
  updatedAt,
}: {
  ownerName: string | null;
  audience: string | null;
  updatedAt: Date;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-[rgba(0,0,0,0.14)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Owner</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{ownerName ?? "—"}</p>
        </div>
        <div className="min-w-0 border-t border-white/8 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Audience</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{audience ?? "—"}</p>
        </div>
        <div className="min-w-0 border-t border-white/8 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-4">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Refreshed</p>
          <p className="mt-2 text-sm text-[--metis-paper]">{updatedAt.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
