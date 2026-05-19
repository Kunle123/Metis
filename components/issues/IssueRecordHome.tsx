import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { IssueAddInputButton } from "@/components/issues/IssueAddInputButton";
import { IssueAttentionSummaryCard } from "@/components/issues/IssueAttentionSummary";
import { SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import type { IssueAttentionItem } from "@/lib/issues/issueAttentionSummary";
import { issueAddInputHref, issueHrefForNavItem, issueRecordViewItems } from "@/lib/issues/issueNav";
import { cn } from "@/lib/utils";

type RecordStat = {
  label: string;
  value: string;
  href: string;
  detail?: string;
};

type RecentActivity = {
  id: string;
  label: string;
  summary: string;
  when: string;
};

const outputLinks = [
  { label: "Brief", path: "/brief" as const },
  { label: "Messages", path: "/messages" as const },
  { label: "Export", path: "/export" as const },
];

export function IssueRecordHome({
  issueRoutePrefix,
  title,
  status,
  severity,
  issueType,
  ownerName,
  canWrite,
  attentionItems,
  stats,
  briefStatus,
  recentActivity,
}: {
  issueRoutePrefix: string;
  title: string;
  status: string;
  severity: string;
  issueType: string;
  ownerName: string | null;
  canWrite: boolean;
  attentionItems: IssueAttentionItem[];
  stats: RecordStat[];
  briefStatus: string;
  recentActivity: RecentActivity[];
}) {
  const statByLabel = Object.fromEntries(stats.map((s) => [s.label, s]));

  return (
    <div className="space-y-6">
      <IssueAttentionSummaryCard attentionItems={attentionItems} />

      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[--metis-brass-soft]">Issue record</p>
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-tight text-[--metis-paper] sm:text-[2.15rem]">{title}</h2>
              <p className="max-w-2xl text-sm leading-7 text-[--metis-paper-muted]">
                This is the live issue record for this matter. Add material here; Metis structures it into sources, claims, open
                questions, and briefing outputs. You do not need to return to the dashboard to keep working on this issue.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                  {status}
                </Badge>
                <Badge className="border-0 bg-[--metis-status-danger-bg] text-[--metis-status-danger-fg]">{severity}</Badge>
                <Badge className="border border-[--metis-outline-subtle] bg-transparent text-[--metis-text-secondary]">{issueType}</Badge>
                {ownerName ? (
                  <span className="text-[0.72rem] text-[--metis-text-tertiary]">Owner · {ownerName}</span>
                ) : null}
              </div>
            </div>
            {canWrite ? (
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <IssueAddInputButton issueRoutePrefix={issueRoutePrefix} />
                <Link
                  href={issueAddInputHref(issueRoutePrefix)}
                  className="text-center text-[0.72rem] text-[--metis-text-tertiary] underline-offset-4 hover:text-[--metis-paper] hover:underline"
                >
                  Paste notes, email, or instructions
                </Link>
              </div>
            ) : (
              <p className="max-w-[14rem] text-[0.72rem] leading-snug text-[--metis-text-tertiary] sm:text-right">
                View-only access — you can review the record but cannot add updates.
              </p>
            )}
          </div>
        </div>

        {canWrite ? (
          <Link
            href={issueAddInputHref(issueRoutePrefix)}
            className="group block border-b border-[--metis-outline-subtle] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--metis-brass)_14%,transparent),color-mix(in_oklab,var(--metis-surface-toolbar)_55%,transparent))] px-6 py-5 transition hover:bg-[color-mix(in_oklab,var(--metis-brass)_18%,transparent)] sm:px-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[--metis-brass-soft]">Add to this issue</p>
                <p className="text-base font-medium text-[--metis-paper]">Add update</p>
                <p className="max-w-xl text-sm leading-6 text-[--metis-paper-muted]">
                  Add new material to this issue. Paste an email, note, update, call summary or instruction, or add a structured source,
                  claim, open question or internal note.
                </p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[--metis-brass-soft] transition group-hover:translate-x-0.5" aria-hidden />
            </div>
          </Link>
        ) : null}

        <div className="space-y-6 px-6 py-6 sm:px-7 sm:py-7">
          <section className="space-y-3">
            <div className="space-y-1">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Structured record</p>
              <p className="max-w-2xl text-sm leading-6 text-[--metis-paper-muted]">
                Sources, claims, open questions and recorded material are facets of this issue record — not separate issues. Open a view to
                work the register in full.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {issueRecordViewItems.map((view) => {
                const href = issueHrefForNavItem(issueRoutePrefix, view);
                const isOverview = view.id === "overview";
                const stat = view.statKey ? statByLabel[view.statKey] : null;

                return (
                  <Link
                    key={view.id}
                    href={href}
                    aria-current={isOverview ? "page" : undefined}
                    className={cn(
                      "rounded-[1.15rem] border px-4 py-4 transition",
                      isOverview
                        ? "border-[--metis-brass]/35 bg-[color-mix(in_oklab,var(--metis-brass)_12%,transparent)] ring-1 ring-[--metis-brass]/20"
                        : "border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_78%,transparent)] hover:border-[--metis-outline-strong] hover:bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[0.62rem] uppercase tracking-[0.16em]",
                        isOverview ? "text-[--metis-brass-soft]" : "text-[--metis-text-tertiary]",
                      )}
                    >
                      {view.label}
                      {isOverview ? " · you are here" : null}
                    </p>
                    {stat ? (
                      <p className="mt-2 font-[Cormorant_Garamond] text-3xl leading-none text-[--metis-paper]">{stat.value}</p>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-[--metis-paper]">{isOverview ? "At a glance" : "Open →"}</p>
                    )}
                    <p className="mt-1.5 text-[0.72rem] leading-snug text-[--metis-paper-muted]">{view.detail}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="space-y-3 border-t border-[--metis-outline-subtle] pt-6">
            <div className="space-y-1">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Outputs</p>
              <p className="text-sm leading-6 text-[--metis-paper-muted]">
                Brief, messages and export packages are generated from the structured record.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {outputLinks.map((out) => {
                const href = `${issueRoutePrefix}${out.path}`;
                const messagesStat = statByLabel["Messages"];
                const isBrief = out.label === "Brief";

                return (
                  <Link
                    key={out.label}
                    href={href}
                    className="rounded-[1.15rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_78%,transparent)] px-4 py-4 transition hover:border-[--metis-outline-strong] hover:bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)]"
                  >
                    <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">{out.label}</p>
                    {isBrief ? (
                      <p className="mt-2 text-sm font-medium leading-snug text-[--metis-paper]">{briefStatus}</p>
                    ) : out.label === "Messages" && messagesStat ? (
                      <p className="mt-2 font-[Cormorant_Garamond] text-3xl leading-none text-[--metis-paper]">{messagesStat.value}</p>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-[--metis-paper]">Open →</p>
                    )}
                    <p className="mt-1.5 text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                      {isBrief ? "Generated brief for this issue" : out.label === "Messages" ? "Audience drafts" : "Briefing pack export"}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {recentActivity.length > 0 ? (
            <section className="space-y-3 border-t border-[--metis-outline-subtle] pt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">Recent activity</p>
                <Link
                  href={`${issueRoutePrefix}/activity`}
                  className="text-[0.72rem] text-[--metis-brass-soft] underline-offset-4 hover:underline"
                >
                  Full timeline →
                </Link>
              </div>
              <ul className="space-y-2">
                {recentActivity.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[--metis-text-tertiary]">{row.label}</p>
                      <p className="text-[0.68rem] text-[--metis-text-tertiary]">{row.when}</p>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-[--metis-paper]">{row.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}
