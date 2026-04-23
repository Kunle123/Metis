import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  OctagonAlert,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";

type ConfidenceLevel = "Confirmed" | "Likely" | "Unclear" | "Needs validation";
type ReadinessState =
  | "Open gap"
  | "Needs validation"
  | "Source conflict"
  | "Updated since last version"
  | "Ready for review"
  | "Ready to circulate"
  | "Blocked";

const confidenceClassMap: Record<ConfidenceLevel, string> = {
  Confirmed:
    "border-emerald-400/35 bg-[rgba(18,83,58,0.62)] text-emerald-50 ring-1 ring-emerald-300/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  Likely:
    "border-[rgba(224,183,111,0.45)] bg-[rgba(118,84,26,0.5)] text-[rgba(255,237,202,0.98)] ring-1 ring-[rgba(224,183,111,0.18)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  Unclear:
    "border-amber-400/40 bg-[rgba(117,72,13,0.54)] text-amber-50 ring-1 ring-amber-300/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  "Needs validation":
    "border-rose-400/40 bg-[rgba(118,27,46,0.56)] text-rose-50 ring-1 ring-rose-300/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
};

const readinessClassMap: Record<ReadinessState, string> = {
  "Open gap":
    "border-[rgba(227,176,73,0.5)] bg-[rgba(131,82,17,0.72)] text-amber-50 ring-1 ring-[rgba(245,191,88,0.28)] shadow-[0_10px_24px_rgba(88,58,12,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
  "Needs validation":
    "border-[rgba(220,112,136,0.52)] bg-[rgba(114,31,55,0.76)] text-rose-50 ring-1 ring-[rgba(241,137,160,0.28)] shadow-[0_10px_24px_rgba(70,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.06)]",
  "Source conflict":
    "border-[rgba(218,118,134,0.52)] bg-[rgba(90,33,47,0.78)] text-rose-50 ring-1 ring-[rgba(235,138,152,0.28)] shadow-[0_10px_24px_rgba(67,19,31,0.24),inset_0_1px_0_rgba(255,255,255,0.06)]",
  "Updated since last version":
    "border-[rgba(112,191,232,0.48)] bg-[rgba(19,86,118,0.72)] text-sky-50 ring-1 ring-[rgba(138,214,250,0.24)] shadow-[0_10px_24px_rgba(14,48,73,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
  "Ready for review":
    "border-[rgba(148,169,194,0.38)] bg-[rgba(49,63,82,0.72)] text-slate-50 ring-1 ring-[rgba(203,213,225,0.18)] shadow-[0_10px_24px_rgba(23,30,40,0.22),inset_0_1px_0_rgba(255,255,255,0.05)]",
  "Ready to circulate":
    "border-[rgba(76,198,143,0.48)] bg-[rgba(18,91,60,0.76)] text-emerald-50 ring-1 ring-[rgba(108,226,168,0.24)] shadow-[0_10px_24px_rgba(15,54,38,0.22),inset_0_1px_0_rgba(255,255,255,0.06)]",
  Blocked:
    "border-[rgba(236,98,116,0.56)] bg-[rgba(116,23,31,0.8)] text-red-50 ring-1 ring-[rgba(248,127,143,0.28)] shadow-[0_10px_24px_rgba(73,15,20,0.26),inset_0_1px_0_rgba(255,255,255,0.06)]",
};

const readinessIconMap: Record<ReadinessState, typeof Clock3> = {
  "Open gap": AlertTriangle,
  "Needs validation": ShieldAlert,
  "Source conflict": OctagonAlert,
  "Updated since last version": RefreshCcw,
  "Ready for review": Clock3,
  "Ready to circulate": CheckCircle2,
  Blocked: OctagonAlert,
};

export function ConfidencePill({ level }: { level: ConfidenceLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.22em]",
        confidenceClassMap[level],
      )}
    >
      {level}
    </span>
  );
}

export function ReadinessPill({ state }: { state: ReadinessState }) {
  const Icon = readinessIconMap[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.66rem] font-medium uppercase tracking-[0.22em]",
        readinessClassMap[state],
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {state}
    </span>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="metis-eyebrow flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.28em] text-[--metis-ink-soft]">
      <span className="h-px w-8 bg-[--metis-brass]/60" />
      <span>{children}</span>
    </div>
  );
}

export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card
      className={cn(
        "metis-surface metis-primary-surface rounded-[1.7rem] border border-white/10 shadow-[0_28px_90px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="metis-surface metis-support-surface relative overflow-hidden rounded-[1.35rem] border px-4 py-4 shadow-[0_16px_42px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[--metis-brass]/60 to-transparent" />
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
        <span className="font-[Cormorant_Garamond] text-[2.35rem] leading-none text-[--metis-paper]">{value}</span>
        <span className="max-w-[9rem] text-right text-[0.72rem] leading-5 text-[--metis-paper-muted]">{detail}</span>
      </div>
    </div>
  );
}

const navGroups = ["Overview & intake", "Briefing workspace", "Review & circulation"] as const;

const primaryNav = [
  { id: "dashboard", group: navGroups[0], path: "/", shortLabel: "Dashboard" },
  { id: "setup", group: navGroups[0], path: "/setup", shortLabel: "Setup" },
  { id: "brief", group: navGroups[1], path: "/brief", shortLabel: "Brief" },
  { id: "sources", group: navGroups[1], path: "/sources", shortLabel: "Sources" },
  { id: "gaps", group: navGroups[1], path: "/gaps", shortLabel: "Gaps" },
  { id: "input", group: navGroups[1], path: "/input", shortLabel: "Input" },
  { id: "compare", group: navGroups[2], path: "/compare", shortLabel: "Compare" },
  { id: "export", group: navGroups[2], path: "/export", shortLabel: "Export" },
] as const;

const issueWorkspaceNavIds = new Set<(typeof primaryNav)[number]["id"]>(["brief", "sources", "gaps", "input", "compare", "export"]);

const issueOnlyNav = [{ id: "activity", group: navGroups[1], path: "/activity", shortLabel: "Activity" }] as const;

export function MetisShell({
  activePath,
  pageTitle,
  pageMeta,
  children,
  showOperationalSnapshot,
  issueRoutePrefix,
  activeIssue,
}: {
  activePath: string;
  pageTitle: string;
  pageMeta?: string;
  children: ReactNode;
  showOperationalSnapshot?: boolean;
  /**
   * When viewing issue-scoped workspace pages, keep left-rail navigation inside the same issue.
   * Example: `/issues/<issueId>`
   */
  issueRoutePrefix?: string;
  activeIssue?: {
    title: string;
    severity?: string | null;
    openGapsCount?: number | null;
    updatedAt?: Date | null;
  };
}) {
  const shouldShowOperationalSnapshot = showOperationalSnapshot ?? activePath === "/";

  function navHrefForItem(item: (typeof primaryNav)[number]) {
    if (issueRoutePrefix && issueWorkspaceNavIds.has(item.id)) {
      return `${issueRoutePrefix}${item.path}`;
    }
    return item.path;
  }

  function navHrefForIssueOnlyItem(item: (typeof issueOnlyNav)[number]) {
    return `${issueRoutePrefix}${item.path}`;
  }

  // Sprint 0: static operational snapshot and active issue preview to preserve Manus shell layout.
  const issueStats = [
    { label: "Active issues", value: "12", detail: "+3 since yesterday" },
    { label: "Briefs ready to circulate", value: "4", detail: "2 awaiting legal validation" },
    { label: "Open clarification gaps", value: "17", detail: "7 critical across all issues" },
    { label: "Average time to first draft", value: "18 min", detail: "Target under 20" },
  ];

  const activeNavItem = primaryNav.find((item) => item.path === activePath) ?? primaryNav[0];
  const activeGroup = activeNavItem.group;

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(164,132,82,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,84,103,0.06),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(27,59,55,0.09),transparent_24%)]" />
      <div className="relative grid lg:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/6 bg-[linear-gradient(180deg,rgba(7,10,11,0.99),rgba(11,15,16,0.985))] px-6 py-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="space-y-4 border-b border-white/8 pb-7">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  <span className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">M</span>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[--metis-ink-soft]">Metis</p>
                  <p className="mt-1 font-[Cormorant_Garamond] text-3xl text-[--metis-paper]">Briefing</p>
                </div>
              </div>
            </div>

            <nav className="space-y-5">
              {navGroups.map((group) => {
                const items = primaryNav.filter((item) => item.group === group);
                const issueItems = issueRoutePrefix ? issueOnlyNav.filter((item) => item.group === group) : [];
                const groupIsActive = items.some((item) => item.path === activePath);

                return (
                  <div
                    key={group}
                    className={cn(
                      "space-y-2 rounded-[1.55rem] border px-3 py-3 transition duration-300",
                      groupIsActive
                        ? "border-[rgba(224,183,111,0.24)] bg-[linear-gradient(180deg,rgba(224,183,111,0.09),rgba(224,183,111,0.018))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border-white/6 bg-[rgba(255,255,255,0.015)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 px-1">
                      <p
                        className={cn(
                          "text-[0.62rem] uppercase tracking-[0.28em] text-[--metis-ink-soft]",
                          groupIsActive && "text-[--metis-brass-soft]",
                        )}
                      >
                        {group}
                      </p>
                      {group === activeGroup ? (
                        <span className="rounded-full border border-[--metis-brass]/20 bg-[--metis-brass]/10 px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.26em] text-[--metis-brass-soft]">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const isActive = item.path === activePath;
                        return (
                          <Link
                            key={item.id}
                            href={navHrefForItem(item)}
                            className={cn(
                              "group relative flex items-start gap-3 overflow-hidden rounded-[1.3rem] border px-4 py-3 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60",
                              isActive
                                ? "border-[rgba(224,183,111,0.48)] bg-[linear-gradient(135deg,rgba(224,183,111,0.28),rgba(78,55,20,0.76))] ring-1 ring-[rgba(224,183,111,0.3)] shadow-[0_28px_72px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.1)]"
                                : "border-white/5 bg-[rgba(0,0,0,0.18)] hover:border-white/10 hover:bg-[rgba(255,255,255,0.045)]",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute inset-y-2 left-1 w-[6px] rounded-full bg-transparent transition duration-300",
                                isActive && "bg-[--metis-brass-soft] shadow-[0_0_28px_rgba(224,183,111,0.5)]",
                              )}
                            />
                            <span
                              className={cn(
                                "mt-1 h-2.5 w-2.5 rounded-full border border-white/10 bg-white/10 shadow-[0_0_0_4px_rgba(255,255,255,0.02)]",
                                isActive &&
                                  "border-[--metis-brass-soft]/70 bg-[--metis-brass-soft] shadow-[0_0_0_5px_rgba(224,183,111,0.16)]",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className={cn("text-sm font-medium text-[--metis-paper]", isActive && "text-white")}>
                                  {item.shortLabel}
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 text-[--metis-ink-soft] transition duration-300",
                                    isActive ? "translate-x-0 text-[--metis-brass-soft]" : "group-hover:translate-x-0.5",
                                  )}
                                />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      {issueRoutePrefix
                        ? issueItems.map((item) => {
                            const isActive = item.path === activePath;
                            return (
                              <Link
                                key={item.id}
                                href={navHrefForIssueOnlyItem(item)}
                                className={cn(
                                  "group relative flex items-start gap-3 overflow-hidden rounded-[1.3rem] border px-4 py-3 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60",
                                  isActive
                                    ? "border-[rgba(224,183,111,0.48)] bg-[linear-gradient(135deg,rgba(224,183,111,0.28),rgba(78,55,20,0.76))] ring-1 ring-[rgba(224,183,111,0.3)] shadow-[0_28px_72px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.1)]"
                                    : "border-white/5 bg-[rgba(0,0,0,0.18)] hover:border-white/10 hover:bg-[rgba(255,255,255,0.045)]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "absolute inset-y-2 left-1 w-[6px] rounded-full bg-transparent transition duration-300",
                                    isActive && "bg-[--metis-brass-soft] shadow-[0_0_28px_rgba(224,183,111,0.5)]",
                                  )}
                                />
                                <span
                                  className={cn(
                                    "mt-1 h-2.5 w-2.5 rounded-full border border-white/10 bg-white/10 shadow-[0_0_0_4px_rgba(255,255,255,0.02)]",
                                    isActive &&
                                      "border-[--metis-brass-soft]/70 bg-[--metis-brass-soft] shadow-[0_0_0_5px_rgba(224,183,111,0.16)]",
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className={cn("text-sm font-medium text-[--metis-paper]", isActive && "text-white")}>
                                      {item.shortLabel}
                                    </span>
                                    <ChevronRight
                                      className={cn(
                                        "h-4 w-4 text-[--metis-ink-soft] transition duration-300",
                                        isActive ? "translate-x-0 text-[--metis-brass-soft]" : "group-hover:translate-x-0.5",
                                      )}
                                    />
                                  </div>
                                </div>
                              </Link>
                            );
                          })
                        : null}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <SurfaceCard className="metis-support-surface overflow-hidden border-[--metis-brass]/18">
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-medium leading-6 text-[--metis-paper]">Active issue</h3>
                    <p className="mt-1 text-sm text-[--metis-paper-muted]">
                      {activeIssue?.title ?? "Select an issue from the ledger."}
                    </p>
                  </div>
                  <Badge className="border-0 bg-rose-900/40 text-rose-100">{activeIssue?.severity ?? "Critical"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-[--metis-paper-muted]">
                  <div className="rounded-2xl border border-white/8 bg-[rgba(0,0,0,0.16)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[0.68rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Open gaps</div>
                    <div className="mt-2 text-xl text-[--metis-paper]">{activeIssue?.openGapsCount ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[rgba(0,0,0,0.16)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[0.68rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Updated</div>
                    <div className="mt-2 text-sm text-[--metis-paper]">
                      {activeIssue?.updatedAt ? activeIssue.updatedAt.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </aside>

        <main className="relative min-h-0 min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-[1520px] flex-col overflow-x-clip rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,24,0.94),rgba(10,14,15,0.985))] shadow-[0_32px_120px_rgba(0,0,0,0.52)]">
            <header className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] px-5 py-5 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  {pageMeta ? <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[--metis-ink-soft]">{pageMeta}</p> : null}
                  <h1 className="font-[Cormorant_Garamond] text-3xl text-[--metis-paper] sm:text-4xl">{pageTitle}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-[rgba(255,255,255,0.035)] px-4 py-2 text-sm text-[--metis-paper-muted] md:flex">
                    <Clock3 className="h-4 w-4 text-[--metis-brass]" />
                    Refreshed 12 minutes ago
                  </div>
                  <LogoutButton />
                  {issueRoutePrefix ? (
                    <Button asChild className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                      <Link href={`${issueRoutePrefix}/export`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Prepare output
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] opacity-60">
                      <FileText className="mr-2 h-4 w-4" />
                      Prepare output
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {shouldShowOperationalSnapshot ? (
              <div className="border-b border-white/8 bg-[rgba(255,255,255,0.016)] px-5 py-4 sm:px-7 lg:px-8">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[rgba(176,171,160,0.62)]">Operational snapshot</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {issueStats.map((stat) => (
                    <MetricCard key={stat.label} {...stat} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-b border-white/8 bg-[rgba(255,255,255,0.01)] px-5 py-2 sm:px-7 lg:px-8" />
            )}

            <div className="min-w-0 flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),transparent_12%)] px-5 py-6 sm:px-7 lg:px-8">
              {children}
            </div>

            <div className="border-t border-white/8 bg-[rgba(255,255,255,0.01)] px-5 py-3 sm:px-7 lg:px-8">
              <div className="text-right text-[0.78rem] uppercase tracking-[0.24em] text-[--metis-ink-soft]">Internal</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

