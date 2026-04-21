export function IssueStatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/10 bg-[rgba(0,0,0,0.16)] p-3">
      <p className="break-words text-[0.62rem] font-medium uppercase leading-snug tracking-[0.14em] text-[--metis-ink-soft]">
        {label}
      </p>
      <div className="mt-2 text-2xl text-[--metis-paper]">{value}</div>
    </div>
  );
}
