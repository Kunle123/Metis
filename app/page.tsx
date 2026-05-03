import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { DashboardOverviewStrip } from "@/components/dashboard/DashboardOverviewStrip";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { IssueSummaryRow } from "@/components/dashboard/IssueSummaryRow";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildOperationalSnapshotMetrics } from "@/lib/dashboard/buildOperationalSnapshotMetrics";
import { getDashboardSnapshot } from "@/lib/dashboard/getDashboardSnapshot";

export const dynamic = "force-dynamic";

const templateCards = [
  {
    id: "cyber",
    name: "Cyber incident",
    description: "Front-load chronology, customer exposure, severity degradation, and legal notification thresholds.",
    estimatedSetup: "3–4 min",
    issueType: "Operational + reputational",
  },
  {
    id: "regulatory",
    name: "Regulatory announcement",
    description: "Frame what changed, what it means, and which internal facts still require legal validation.",
    estimatedSetup: "4–5 min",
    issueType: "Policy and compliance",
  },
  {
    id: "outage",
    name: "Operational outage",
    description: "Clarify service impact, workaround status, likely customer questions, and update cadence.",
    estimatedSetup: "3 min",
    issueType: "Operational disruption",
  },
] as const;

const dashboardQuickLinksBase = [
  { label: "Full brief workspace" as const, href: "/brief" },
  { label: "Settings · Audience groups" as const, href: "/audience-groups" },
] as const;

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();
  const { issues, aggregates, recentActivity } = snapshot;
  const operationalSnapshotMetrics = buildOperationalSnapshotMetrics(snapshot);

  const firstIssue = issues[0] ?? null;
  const quickLinks = firstIssue
    ? [
        { label: "Issue workspace" as const, href: `/issues/${firstIssue.id}` },
        { label: "Open questions (first issue)" as const, href: `/issues/${firstIssue.id}/gaps` },
        { label: "Sources (first issue)" as const, href: `/issues/${firstIssue.id}/sources` },
        { label: "Full brief" as const, href: `/issues/${firstIssue.id}/brief?mode=full` },
        { label: "Messages" as const, href: `/issues/${firstIssue.id}/messages` },
        { label: "Prepare output" as const, href: `/issues/${firstIssue.id}/export` },
        ...dashboardQuickLinksBase,
      ]
    : [...dashboardQuickLinksBase];

  return (
    <MetisShell activePath="/" pageTitle="Issues Dashboard" operationalSnapshotMetrics={operationalSnapshotMetrics}>
      <div className="space-y-8">
        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
            <Link href="/setup">New issue</Link>
          </Button>
          <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]" asChild>
            <Link href="/setup">Templates</Link>
          </Button>
        </div>

        {/* Primary column wider; side rail capped so templates feel supportive, not competing */}
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(248px,320px)]">
          <SurfaceCard className="min-w-0 overflow-hidden">
            <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4 sm:px-6">
              <h3 className="font-[Cormorant_Garamond] text-3xl text-[--metis-paper]">Issues</h3>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[--metis-paper-muted]">
                Work each row from links on the right — sources, open questions, briefs, Messages, prepare output, activity timeline.
              </p>
              <p className="mt-3 text-[0.65rem] leading-relaxed text-[--metis-ink-soft]">
                Search and filters — coming soon (use Quick routes below for common jumps).
              </p>
            </div>

            <DashboardOverviewStrip aggregates={aggregates} />

            <div className="space-y-4 p-4 sm:p-5">
              {issues.length === 0 ? (
                <div className="rounded-[1.45rem] border border-white/10 bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
                  <p className="text-sm font-medium text-[--metis-paper]">No issue records yet</p>
                  <p className="mt-3 text-sm leading-relaxed text-[--metis-paper-muted]">
                    Create your first issue to track sources, open questions, briefs, and Messages drafts. Audience groups you reuse live under
                    Settings → Audience groups.
                  </p>
                  <Button asChild className="mt-6 rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                    <Link href="/setup">Create an issue</Link>
                  </Button>
                </div>
              ) : (
                issues.map((issue) => <IssueSummaryRow key={issue.id} issue={issue} />)
              )}
            </div>
          </SurfaceCard>

          <aside className="min-w-0 space-y-6">
            <SurfaceCard className="overflow-hidden border-white/8">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-4 sm:px-5">
                <h3 className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.75)]">Scenario templates</h3>
                <p className="mt-2 text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                  Illustrative shapes only — each creates a normal Metis issue record; not live monitoring.
                </p>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                {templateCards.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[1.1rem] border border-white/8 bg-[rgba(255,255,255,0.02)] px-4 py-3 transition hover:border-white/12 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Star className="h-3.5 w-3.5 shrink-0 text-[--metis-brass]" aria-hidden />
                        <h4 className="truncate text-sm font-medium text-[--metis-paper]">{template.name}</h4>
                      </div>
                      <Badge className="shrink-0 border-0 bg-white/[0.06] px-2 py-0 text-[0.62rem] text-[--metis-paper-muted]">
                        {template.estimatedSetup}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-[0.72rem] leading-snug text-[--metis-paper-muted]">{template.description}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.68rem] text-[--metis-ink-soft]">
                      <span>{template.issueType}</span>
                      <Link href="/setup" className="inline-flex items-center gap-1 text-[--metis-brass-soft] hover:text-white">
                        Start
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden border-white/8">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-4 sm:px-5">
                <h3 className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[rgba(176,171,160,0.75)]">Recent activity</h3>
              </div>
              <div className="p-4 sm:p-5">
                <DashboardRecentActivity items={recentActivity} />
              </div>
            </SurfaceCard>
          </aside>
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="border-t border-white/8 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <p className="shrink-0 text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Quick routes</p>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.025)] px-4 py-2.5 text-sm text-[--metis-paper-muted] transition hover:border-white/14 hover:bg-white/[0.05] hover:text-[--metis-paper]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
