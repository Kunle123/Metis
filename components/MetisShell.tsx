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
import { confidenceDisplayLabel } from "@/lib/ui/confidenceDisplayLabel";

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
      {confidenceDisplayLabel(level)}
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
      <div className="mt-4 flex flex-col gap-1 border-t border-white/8 pt-4 text-left">
        <span className="font-[Cormorant_Garamond] text-[2.35rem] leading-none text-[--metis-paper]">{value}</span>
        <span className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">{detail}</span>
      </div>
    </div>
  );
}

type GlobalNavGroup = "Work" | "Current issue" | "Review & output" | "Records" | "Settings";

const workNav = [
  { id: "dashboard", group: "Work" as GlobalNavGroup, path: "/", shortLabel: "Dashboard" },
  { id: "setup", group: "Work" as GlobalNavGroup, path: "/setup", shortLabel: "New issue" },
] as const;

const settingsNav = [
  { id: "audience-groups", group: "Settings" as GlobalNavGroup, path: "/audience-groups", shortLabel: "Audience groups" },
] as const;

const primaryNav = [...workNav, ...settingsNav] as const;

const issueWorkspacePrimaryNav = [{ id: "workspace" as const, path: "/workspace" as const, shortLabel: "Workspace" }] as const;

const issueOutputToolsNav = [
  { id: "brief" as const, path: "/brief" as const, shortLabel: "Brief" },
  { id: "messages" as const, path: "/messages" as const, shortLabel: "Messages" },
  { id: "compare" as const, path: "/compare" as const, shortLabel: "Compare" },
  { id: "export" as const, path: "/export" as const, shortLabel: "Export" },
  { id: "comms-plan" as const, path: "/comms-plan" as const, shortLabel: "Comms plan" },
  { id: "activity" as const, path: "/activity" as const, shortLabel: "Activity" },
] as const;

const issueRecordToolsNav = [
  { id: "sources" as const, path: "/sources" as const, shortLabel: "Sources" },
  { id: "gaps" as const, path: "/gaps" as const, shortLabel: "Open questions" },
  { id: "input" as const, path: "/input" as const, shortLabel: "Observations" },
] as const;

const issueToolsNav = [...issueOutputToolsNav, ...issueRecordToolsNav] as const;

const navCurrentIssue = [issueWorkspacePrimaryNav[0]];
const navReviewOutput = issueOutputToolsNav;
const navRecords = issueRecordToolsNav;

type IssueScopedNavItem = (typeof issueWorkspacePrimaryNav)[number] | (typeof issueToolsNav)[number];
const issueToolIds = new Set<string>(issueToolsNav.map((i) => i.id));

function filterGlobalNavItems(_issueRoutePrefix: string | undefined) {
  // Keep global navigation stable; issue-context tools are rendered as an additional group.
  // Avoid hiding global "All issues tools" when an issue is active.
  return (_item: (typeof primaryNav)[number]) => true;
}

function formatLondonDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  // Deterministic SSR/CSR formatting to avoid hydration mismatches from locale/timezone differences.
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export type OperationalSnapshotMetric = {
  label: string;
  value: string;
  detail: string;
};

export function MetisShell({
  activePath,
  pageTitle,
  pageMeta,
  children,
  showOperationalSnapshot,
  /** When set (e.g. Issues Dashboard), renders real DB-backed KPI strip. Must not contain placeholder trend copy. */
  operationalSnapshotMetrics,
  issueRoutePrefix,
  activeIssue,
}: {
  activePath: string;
  pageTitle: string;
  pageMeta?: string;
  children: ReactNode;
  showOperationalSnapshot?: boolean;
  operationalSnapshotMetrics?: OperationalSnapshotMetric[] | null;
  /**
   * When viewing issue-scoped workspace pages, keep left-rail navigation inside the same issue.
   * Example: `/issues/<issueId>`
   */
  issueRoutePrefix?: string;
  activeIssue?: {
    title: string;
    severity?: string | null;
    openGapsCount?: number | null;
    ownerName?: string | null;
    updatedAt?: Date | null;
  };
}) {
  const shouldShowOperationalSnapshot = showOperationalSnapshot ?? activePath === "/";
  const globalNavItemVisible = filterGlobalNavItems(issueRoutePrefix);
  const activeGroup = primaryNav.find((item) => item.path === activePath && globalNavItemVisible(item))?.group ?? null;

  function issueHrefForItem(item: IssueScopedNavItem) {
    if (!issueRoutePrefix) return item.path;
    if (item.id === "workspace") return issueRoutePrefix;
    return `${issueRoutePrefix}${item.path}`;
  }

  function navHrefForItem(item: (typeof primaryNav)[number]) {
    return item.path;
  }

  function renderNavItem({
    href,
    label,
    isActive,
    disabled,
  }: {
    href: string;
    label: string;
    isActive: boolean;
    disabled?: boolean;
  }) {
    const base =
      "group relative flex items-start gap-2.5 overflow-hidden rounded-[1.2rem] border px-4 py-2.5 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60";
    const active =
      "border-[rgba(224,183,111,0.48)] bg-[linear-gradient(135deg,rgba(224,183,111,0.28),rgba(78,55,20,0.76))] ring-1 ring-[rgba(224,183,111,0.3)] shadow-[0_28px_72px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.1)]";
    const inactive =
      "border-white/5 bg-[rgba(0,0,0,0.16)] hover:border-white/10 hover:bg-[rgba(255,255,255,0.04)]";
    const disabledCls =
      "border-white/4 bg-[rgba(0,0,0,0.10)] text-[--metis-paper-muted] opacity-45";

    const Wrap: any = disabled ? "div" : Link;
    const wrapProps = disabled ? { role: "link", "aria-disabled": "true" as const } : { href };

    return (
      <Wrap
        {...wrapProps}
        className={cn(base, disabled ? disabledCls : isActive ? active : inactive, disabled && "cursor-not-allowed")}
      >
        <span
          className={cn(
            "absolute inset-y-2 left-1 w-[5px] rounded-full bg-transparent transition duration-300",
            isActive && !disabled && "bg-[--metis-brass-soft] shadow-[0_0_24px_rgba(224,183,111,0.5)]",
          )}
        />
        <span
          className={cn(
            "mt-0.5 h-2 w-2 shrink-0 rounded-full border border-white/10 bg-white/10 shadow-[0_0_0_3px_rgba(255,255,255,0.02)]",
            isActive &&
              !disabled &&
              "border-[--metis-brass-soft]/70 bg-[--metis-brass-soft] shadow-[0_0_0_4px_rgba(224,183,111,0.16)]",
            disabled && "border-white/6 bg-white/5 shadow-none opacity-40",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm font-medium text-[--metis-paper]",
                disabled && "text-[--metis-paper-muted]",
                isActive && !disabled && "text-white",
              )}
            >
              {label}
            </span>
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[--metis-ink-soft] transition duration-300",
                disabled
                  ? "opacity-15"
                  : isActive
                    ? "translate-x-0 text-[--metis-brass-soft]"
                    : "group-hover:translate-x-0.5",
              )}
            />
          </div>
        </div>
      </Wrap>
    );
  }

  function renderNavGroup({
    group,
    items,
    activeGroupLabel,
    metaPill,
  }: {
    group: GlobalNavGroup;
    items: Array<{ id: string; href: string; label: string; isActive: boolean; disabled?: boolean }>;
    activeGroupLabel?: string | null;
    metaPill?: string | null;
  }) {
    if (items.length === 0) return null;
    const groupIsActive = items.some((i) => i.isActive);

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
          {metaPill ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.26em]",
                metaPill === "Select issue"
                  ? "border-white/10 bg-white/5 text-[--metis-ink-soft]"
                  : "border-[--metis-brass]/20 bg-[--metis-brass]/10 text-[--metis-brass-soft]",
              )}
            >
              {metaPill}
            </span>
          ) : activeGroupLabel && group === activeGroupLabel ? (
            <span className="rounded-full border border-[--metis-brass]/20 bg-[--metis-brass]/10 px-2 py-0.5 text-[0.52rem] uppercase tracking-[0.26em] text-[--metis-brass-soft]">
              Active
            </span>
          ) : null}
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id}>
              {renderNavItem({ href: item.href, label: item.label, isActive: item.isActive, disabled: item.disabled })}
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              {renderNavGroup({
                group: "Work",
                activeGroupLabel: activeGroup,
                items: workNav
                  .filter(globalNavItemVisible)
                  .map((i) => ({ id: i.id, href: navHrefForItem(i), label: i.shortLabel, isActive: i.path === activePath })),
              })}

              {renderNavGroup({
                group: "Current issue",
                metaPill: issueRoutePrefix ? "Active" : "Select issue",
                items: navCurrentIssue.map((i) => ({
                  id: i.id,
                  href: issueHrefForItem(i),
                  label: i.shortLabel,
                  isActive: Boolean(issueRoutePrefix) && i.path === activePath,
                  disabled: !issueRoutePrefix,
                })),
              })}

              {renderNavGroup({
                group: "Review & output",
                metaPill: issueRoutePrefix ? null : "Select issue",
                items: navReviewOutput.map((i) => ({
                  id: i.id,
                  href: issueHrefForItem(i),
                  label: i.shortLabel,
                  isActive: Boolean(issueRoutePrefix) && i.path === activePath,
                  disabled: !issueRoutePrefix,
                })),
              })}

              {renderNavGroup({
                group: "Records",
                metaPill: issueRoutePrefix ? null : "Select issue",
                items: navRecords.map((i) => ({
                  id: i.id,
                  href: issueHrefForItem(i),
                  label: i.shortLabel,
                  isActive: Boolean(issueRoutePrefix) && i.path === activePath,
                  disabled: !issueRoutePrefix,
                })),
              })}

              {renderNavGroup({
                group: "Settings",
                activeGroupLabel: activeGroup,
                items: settingsNav
                  .filter(globalNavItemVisible)
                  .map((i) => ({ id: i.id, href: navHrefForItem(i), label: i.shortLabel, isActive: i.path === activePath })),
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
                  <div className="text-[0.68rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Open questions</div>
                    <div className="mt-2 text-xl text-[--metis-paper]">{activeIssue?.openGapsCount ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[rgba(0,0,0,0.16)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="text-[0.68rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Updated</div>
                    <div className="mt-2 text-sm text-[--metis-paper]">
                      {formatLondonDateTime(activeIssue?.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </aside>

        <main className="relative min-h-0 min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-[1520px] flex-col overflow-x-clip rounded-[1.35rem] border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,24,0.94),rgba(10,14,15,0.985))] shadow-[0_32px_120px_rgba(0,0,0,0.52)] sm:rounded-[1.65rem] lg:rounded-[2rem]">
            <header className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.012))] px-5 py-5 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 space-y-2">
                  {pageMeta ? <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[--metis-ink-soft]">{pageMeta}</p> : null}
                  {issueRoutePrefix && activeIssue?.title ? (
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                      Issue · <span className="text-[--metis-paper]">{activeIssue.title}</span>
                    </p>
                  ) : null}
                  <h1 className="font-[Cormorant_Garamond] text-3xl text-[--metis-paper] sm:text-4xl">{pageTitle}</h1>
                  {activeIssue?.ownerName ? (
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">
                      Owner · <span className="text-[--metis-paper]">{activeIssue.ownerName}</span>
                    </p>
                  ) : null}
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  {operationalSnapshotMetrics && operationalSnapshotMetrics.length > 0 ? (
                    <p className="hidden max-w-[20rem] text-[0.72rem] leading-snug text-[--metis-paper-muted] md:block">
                      Totals follow your Metis workspace database at page load — not live external monitoring.
                    </p>
                  ) : (
                    <div className="hidden items-center gap-2 text-[0.72rem] leading-5 text-[--metis-paper-muted] md:flex">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-[--metis-brass]/65" aria-hidden />
                      <span className="text-[--metis-ink-soft]">Internal workspace</span>
                    </div>
                  )}
                  <LogoutButton />
                  {issueRoutePrefix ? (
                    <Button asChild className="rounded-full px-5">
                      <Link href={`${issueRoutePrefix}/export`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Prepare output
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="rounded-full px-5">
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
                  <p className="text-[0.58rem] uppercase tracking-[0.2em] text-[rgba(176,171,160,0.62)]">Workspace snapshot</p>
                </div>
                {operationalSnapshotMetrics && operationalSnapshotMetrics.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {operationalSnapshotMetrics.map((stat) => (
                      <MetricCard key={stat.label} {...stat} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-[--metis-paper-muted]">
                    Workspace metric strip is only populated on the Issues Dashboard. This page does not show inferred trends or targets.
                  </p>
                )}
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

