import Link from "next/link";
import { Activity } from "lucide-react";

import type { DashboardActivityVM } from "@/lib/dashboard/getDashboardSnapshot";
import {
  activityDisplaySummary,
  activityKindLabel,
  formatActivityTimestamp,
} from "@/lib/issues/activityTimelineDisplay";
import { Badge } from "@/components/ui/badge";

export function DashboardRecentActivity({ items }: { items: DashboardActivityVM[] }) {
  if (!items.length) {
    return (
      <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[--metis-paper-muted]">
        No activity yet across your issues — open an issue workspace to add sources, open questions, or generate a brief.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-[--metis-paper-muted]">
        Latest saved changes across issues. This is a short timeline, not a full audit trail.
      </p>
      <ul className="space-y-3">
        {items.map((row) => {
          const href = `/issues/${row.issueId}/activity`;
          const time = formatActivityTimestamp(row.createdAt.toISOString());
          const kindLabel = activityKindLabel(row.kind);
          const summary = activityDisplaySummary(row.kind, row.summary);
          return (
            <li key={row.id}>
              <Link
                href={href}
                className="block rounded-[1.3rem] border border-white/10 bg-[rgba(255,255,255,0.025)] p-4 transition hover:border-white/14 hover:bg-white/[0.05]"
              >
                <div className="flex flex-wrap items-center gap-2 gap-y-2">
                  <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{time}</Badge>
                  <span className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                    <Activity className="h-3.5 w-3.5 text-[--metis-brass]" aria-hidden />
                    {kindLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium text-[--metis-paper]">{row.issueTitle}</p>
                <p className="mt-1 text-sm leading-7 text-[--metis-paper-muted]">{summary}</p>
                {row.actorLabel ? (
                  <p className="mt-2 text-xs text-[--metis-ink-soft]">{row.actorLabel}</p>
                ) : null}
                <p className="mt-3 text-xs font-medium text-[--metis-brass-soft]">Open activity timeline →</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
