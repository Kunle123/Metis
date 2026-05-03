import { cn } from "@/lib/utils";

export function IssueStatTile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col rounded-[1rem] border border-white/10 bg-[rgba(0,0,0,0.16)] p-3", className)}>
      <p className="break-words text-[0.62rem] font-medium uppercase leading-snug tracking-[0.14em] text-[--metis-ink-soft]">
        {label}
      </p>
      <div className="mt-2 tabular-nums text-2xl text-[--metis-paper]">{value}</div>
    </div>
  );
}
