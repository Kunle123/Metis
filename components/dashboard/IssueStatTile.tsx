import { cn } from "@/lib/utils";

export function IssueStatTile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-frame-soft)_86%,transparent)] p-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]",
        className,
      )}
    >
      <p className="break-words text-[0.62rem] font-medium uppercase leading-snug tracking-[0.14em] text-[--metis-ink-soft]">
        {label}
      </p>
      <div className="mt-2 tabular-nums text-2xl text-[--metis-paper]">{value}</div>
    </div>
  );
}
