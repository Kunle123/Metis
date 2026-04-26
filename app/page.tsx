import Link from "next/link";
import { ArrowRight, Filter, Search, Star, Zap } from "lucide-react";

import { IssueSummaryRow } from "@/components/dashboard/IssueSummaryRow";
import { MetisShell, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const recentUpdates = [
  {
    time: "08:52 CET",
    title: "Legal caution added to executive summary",
    detail: "The active cyber issue now distinguishes confirmed outage facts from still-unverified access assumptions.",
  },
  {
    time: "08:24 CET",
    title: "Customer comms questions now affecting narrative risk",
    detail: "Inbound support themes shifted from access failures toward security concern framing in three markets.",
  },
  {
    time: "07:42 CET",
    title: "Holding statement draft opened",
    detail: "Messaging remains unsent pending validation of customer-exposure language and legal thresholds.",
  },
] as const;

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

const dashboardQuickLinksBase = [{ label: "All issues: brief (browse)", href: "/brief" }] as const;

export default async function DashboardPage() {
  const issues = await prisma.issue.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sources: true } } },
  });

  const firstIssue = issues[0] ?? null;
  const quickLinks = firstIssue
    ? [
        { label: "Open workspace" as const, href: `/issues/${firstIssue.id}` },
        { label: "Brief (review)" as const, href: `/issues/${firstIssue.id}/brief?mode=full` },
        { label: "Prepare output" as const, href: `/issues/${firstIssue.id}/export` },
      ]
    : [...dashboardQuickLinksBase];

  return (
    <MetisShell activePath="/" pageTitle="Issues Dashboard">
      <div className="space-y-8">
        <div className="flex flex-wrap justify-end gap-3">
          <Button asChild className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
            <Link href="/setup">New issue brief</Link>
          </Button>
          <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
            Templates
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="font-[Cormorant_Garamond] text-3xl text-[--metis-paper]">Issues</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative min-w-[230px] flex-1 lg:w-[260px] lg:flex-none">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[--metis-ink-soft]" />
                    <Input value="portal outage" readOnly className="h-11 rounded-full border-white/10 bg-white/[0.04] pl-11 text-[--metis-paper]" />
                  </div>
                  <Button variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-[--metis-paper]">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {issues.map((issue, index) => (
                <IssueSummaryRow
                  key={issue.id}
                  issue={{
                    ...issue,
                    sourcesCount: issue._count.sources,
                  }}
                  workspaceHref={`/issues/${issue.id}`}
                />
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-6">
            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-5">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.7)]">Templates</h3>
              </div>
              <div className="space-y-4 p-6">
                {templateCards.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5 transition hover:border-white/14 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-[--metis-brass]" />
                          <h4 className="text-base font-medium text-[--metis-paper]">{template.name}</h4>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[--metis-paper-muted]">{template.description}</p>
                      </div>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{template.estimatedSetup}</Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[--metis-paper-muted]">
                      <span>{template.issueType}</span>
                      <Link href="/setup" className="inline-flex items-center gap-2 text-[--metis-brass-soft] transition hover:text-white">
                        Use template
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard className="overflow-hidden">
              <div className="border-b border-white/10 bg-[rgba(255,255,255,0.03)] px-6 py-5">
                <h3 className="text-[0.78rem] font-medium uppercase tracking-[0.22em] text-[rgba(176,171,160,0.7)]">Updates</h3>
              </div>
              <div className="space-y-4 p-6">
                {recentUpdates.map((update, index) => (
                  <div
                    key={update.time}
                    className="grid grid-cols-[26px_minmax(0,1fr)] gap-4 rounded-[1.3rem] border border-white/10 bg-[rgba(255,255,255,0.025)] p-4"
                  >
                    <div className="flex flex-col items-center pt-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[--metis-brass]" />
                      {index < recentUpdates.length - 1 ? <span className="mt-2 h-full w-px bg-white/10" /> : null}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{update.time}</Badge>
                        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                          <Zap className="h-3.5 w-3.5 text-[--metis-brass]" />
                          Brief update
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-[--metis-paper]">{update.title}</h4>
                      <p className="text-sm leading-7 text-[--metis-paper-muted]">{update.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>

        <SurfaceCard className="overflow-hidden">
          <div className="border-t border-white/8 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Open</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
                {quickLinks.map((item) => (
                  <Link
                    key={item.label}
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

