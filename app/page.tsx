import Link from "next/link";
import { ArrowRight, Filter, Search, Star } from "lucide-react";

import { DashboardOverviewStrip } from "@/components/dashboard/DashboardOverviewStrip";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { IssueSummaryRow } from "@/components/dashboard/IssueSummaryRow";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { issues, aggregates, recentActivity } = await getDashboardSnapshot();

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
    <MetisShell activePath="/" pageTitle="Issues Dashboard">
      <div className="space-y-8">
        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
            <Link href="/setup">New issue</Link>
          </Button>
          <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]" asChild>
            <Link href="/setup">Templates</Link>
          </Button>
        </div>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.85fr)]">
          <SurfaceCard className="min-w-0 overflow-hidden">
            <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="font-[Cormorant_Garamond] text-3xl text-[--metis-paper]">Issues</h3>
                  <p className="mt-2 max-w-xl text-xs leading-relaxed text-[--metis-paper-muted]">
                    Each row is one issue record. Use links on the row to work sources, open questions, briefs, Messages, exports, or the
                    activity timeline.
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-3">
                  <div className="relative min-w-0 w-full flex-1 sm:min-w-[11rem] lg:w-[260px] lg:flex-none">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--metis-ink-soft]" />
                    <Input
                      placeholder="Search issues"
                      disabled
                      title="Search is not available yet"
                      aria-label="Search issues (coming soon)"
                      className="h-11 rounded-full border-white/10 bg-white/[0.04] pl-11 text-[--metis-paper] disabled:opacity-60"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    title="Filters are not available yet"
                    className="rounded-full border-white/10 bg-white/[0.04] text-[--metis-paper] disabled:opacity-60"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
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

          <div className="min-w-0 space-y-6">
            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-5">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.7)]">
                  Scenario templates
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[--metis-paper-muted]">
                  Illustrative starting shapes — all create a normal Metis issue record, not connected to live monitoring.
                </p>
              </div>
              <div className="space-y-4 p-6">
                {templateCards.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 transition hover:border-white/14 hover:bg-white/[0.06]"
                  >
                    <div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-[--metis-brass]" aria-hidden />
                          <h4 className="text-base font-medium text-[--metis-paper]">{template.name}</h4>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[--metis-paper-muted]">{template.description}</p>
                      </div>
                      <Badge className="w-fit shrink-0 border-0 bg-white/8 text-[--metis-paper-muted]">{template.estimatedSetup}</Badge>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 text-sm text-[--metis-paper-muted] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <span>{template.issueType}</span>
                      <Link href="/setup" className="inline-flex items-center gap-2 text-[--metis-brass-soft] transition hover:text-white">
                        Start from template
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-5">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.7)]">Recent activity</h3>
              </div>
              <div className="p-6">
                <DashboardRecentActivity items={recentActivity} />
              </div>
            </SurfaceCard>
          </div>
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
