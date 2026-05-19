"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  PencilLine,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import { BackToIssueRecordLink } from "@/components/issues/BackToIssueRecordLink";
import { RecordCodeHint } from "@/components/issues/RecordCodeHint";
import { SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { cn } from "@/lib/utils";
import { formatGapCode, formatObservationCode } from "@/lib/issueRecordCodes";
import type { Gap } from "@metis/shared/gap";

import { GapCreateForm } from "./gap-create-form";
import { CollapsibleFormPanel } from "../collapsible-form-panel";

type InternalInputListItem = {
  id: string;
  observationNumber: number;
  role: string;
  name: string;
  createdAt: string;
};

/** Base pill for ledger row chips — no `Badge` component defaults so semantic tokens aren’t overwritten by duplicate utilities. */
const LEDGER_ROW_CHIP =
  "inline-flex max-w-full min-w-0 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.68rem] leading-none tabular-nums";

/** Neutral metadata chip for stable record codes (`Q-###`); visually quieter than severity. */
const GAP_RECORD_CHIP_CLASS =
  "border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_58%,transparent)] font-normal uppercase tracking-[0.04em] text-[--metis-text-tertiary]";

function formatIsoShortLondon(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "short", timeStyle: "short" }).format(d);
}

function gapRecordBadgeLabel(gap: Gap) {
  return formatGapCode(gap.gapNumber) ?? `${gap.id.slice(0, 8)}…`;
}

/** `<option>` text — value stays UUID. */
function observationSelectLabel(i: InternalInputListItem) {
  const code = formatObservationCode(i.observationNumber);
  const lead = code ?? `Observation ref · ${i.id.slice(0, 8)}`;
  const when = formatIsoShortLondon(i.createdAt);
  return `${lead} · ${i.role} · ${i.name} · ${when}`;
}

function observationAttributionSecondary(resolvedId: string | null, inputsById: Map<string, InternalInputListItem>): string | null {
  if (!resolvedId) return null;
  const inp = inputsById.get(resolvedId);
  if (!inp) return `Restricted observation`;
  const code = formatObservationCode(inp.observationNumber);
  if (code) return `${code} · ${inp.role} · ${inp.name}`;
  return `Observation ref · ${resolvedId.slice(0, 8)} · ${inp.role} · ${inp.name}`;
}

/** Severity on register rows — must read clearly in light/dark (`Badge` defaults were visually flattening these). */
const severityChipClass: Record<string, string> = {
  Critical:
    "border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_62%,transparent)] font-semibold text-[--metis-status-danger-fg]",
  Important:
    "border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_58%,transparent)] font-semibold text-[--metis-status-warning-fg]",
  Watch:
    "border border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_72%,transparent)] font-medium text-[--metis-status-neutral-fg]",
};

/** Register row status: Open stays neutral versus severity chips; Resolved keeps success. */
const registerStatusChipClass: Record<string, string> = {
  Open:
    "border border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_68%,transparent)] font-medium text-[--metis-status-neutral-fg]",
  Resolved:
    "border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_46%,transparent)] font-medium text-[--metis-status-success-fg]",
};

/** Overview / rail summary aggregates — same semantics; Open count is informational, not a warning. */
const summaryStatusChipClass: Record<string, string> = {
  Open:
    "border border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_65%,transparent)] font-medium text-[--metis-status-neutral-fg]",
  Resolved:
    "border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_46%,transparent)] font-medium text-[--metis-status-success-fg]",
};

const rowTone: Record<string, string> = {
  Open:
    "border border-[color-mix(in_oklab,var(--metis-status-warning-border)_70%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_14%,var(--metis-surface-toolbar)_92%)]",
  Resolved:
    "border border-[color-mix(in_oklab,var(--metis-status-success-border)_65%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_12%,var(--metis-surface-toolbar)_92%)]",
};

function clampText(s: string, max = 180) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function observationInputHref(issueId: string) {
  return `/issues/${issueId}/input`;
}

/** Text link — focus ring; keep next to passive chips, not on chips themselves. */
const ADD_OBSERVATION_LINK_CLASS =
  "rounded-sm font-medium text-[--metis-brass-soft] underline-offset-4 outline-none transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-[--metis-brass-soft] focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_oklab,var(--metis-surface-card)_96%,transparent)] text-[0.72rem]";

/** When observations already exist — info tone; primary path is the selector below. */
function ObservationRequiredGuide({ issueId }: { issueId: string }) {
  const href = observationInputHref(issueId);
  return (
    <div className="rounded-[1rem] border border-[--metis-status-info-border] bg-[color-mix(in_oklab,var(--metis-status-info-bg)_22%,var(--metis-surface-toolbar)_88%)] px-3.5 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[--metis-status-info-fg]">Observation required</p>
      <p className="mt-2 text-xs leading-relaxed text-[--metis-paper-muted]">
        To mark this question answered, select the saved observation that contains the attributable answer below.
      </p>
      <p className="mt-2 min-w-0">
        <Link href={href} className={ADD_OBSERVATION_LINK_CLASS} aria-label="Add another observation — opens Internal observations">
          Add another observation<span aria-hidden> →</span>
        </Link>
      </p>
    </div>
  );
}

function NoObservationsEmptyState({ issueId }: { issueId: string }) {
  const href = observationInputHref(issueId);
  return (
    <div className="rounded-[1rem] border border-[color-mix(in_oklab,var(--metis-status-warning-border)_55%,var(--metis-outline-subtle))] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_14%,var(--metis-surface-toolbar)_92%)] px-3.5 py-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_8%,transparent)]">
      <p className="text-sm font-medium text-[--metis-status-warning-fg]">No observations available yet</p>
      <p className="mt-1 text-xs leading-relaxed text-[--metis-paper-muted]">
        Create a saved observation first, then return here to mark the question answered.
      </p>
      <p className="mt-2 min-w-0">
        <Link href={href} className={ADD_OBSERVATION_LINK_CLASS} aria-label="Add observation — opens Internal observations">
          Add observation<span aria-hidden> →</span>
        </Link>
      </p>
    </div>
  );
}

export function GapLedger({
  issueId,
  gaps,
  internalInputs,
  issueOpenGapsCount,
}: {
  issueId: string;
  gaps: Gap[];
  internalInputs: InternalInputListItem[];
  issueOpenGapsCount: number;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolveSelections, setResolveSelections] = useState<Record<string, string>>({});
  const [busyGapId, setBusyGapId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const observationInputPageHref = observationInputHref(issueId);

  const inputsById = useMemo(() => new Map(internalInputs.map((i) => [i.id, i])), [internalInputs]);

  const internalInputOptionLabelById = useMemo(() => {
    const map = new Map<string, string>();
    internalInputs.forEach((i) => {
      map.set(i.id, observationSelectLabel(i));
    });
    return map;
  }, [internalInputs]);

  const openCount = useMemo(() => gaps.filter((item) => item.status === "Open").length, [gaps]);
  const resolvedCount = useMemo(() => gaps.filter((item) => item.status === "Resolved").length, [gaps]);
  const criticalOpenCount = useMemo(
    () => gaps.filter((item) => item.status === "Open" && item.severity === "Critical").length,
    [gaps],
  );
  const openGaps = useMemo(() => gaps.filter((item) => item.status === "Open"), [gaps]);
  const resolvedGaps = useMemo(() => gaps.filter((item) => item.status === "Resolved"), [gaps]);

  const sectionPressure = useMemo(
    () =>
      Array.from(
        gaps
          .reduce((map, item) => {
            const key = item.linkedSection ?? "Unassigned";
            const current = map.get(key) ?? { section: key, open: 0, resolved: 0 };

            if (item.status === "Resolved") {
              current.resolved += 1;
            } else {
              current.open += 1;
            }

            map.set(key, current);
            return map;
          }, new Map<string, { section: string; open: number; resolved: number }>())
          .values(),
      ).sort((a, b) => b.open - a.open || a.section.localeCompare(b.section)),
    [gaps],
  );

  const openCountMatchesIssue = openCount === issueOpenGapsCount;

  const isEditingDirty = useMemo(() => {
    if (!editingId) return false;
    const gap = gaps.find((item) => item.id === editingId);
    if (!gap) return false;
    const original = gap.prompt.trim();
    const draft = (draftQuestions[editingId] ?? gap.prompt).trim();
    return draft !== original;
  }, [draftQuestions, editingId, gaps]);

  useUnsavedChangesWarning({ isDirty: isEditingDirty, isSaving: !!busyGapId });

  const startEditing = (gap: Gap) => {
    setOpenId(gap.id);
    setEditingId(gap.id);
    setDraftQuestions((current) => ({
      ...current,
      [gap.id]: current[gap.id] ?? gap.prompt,
    }));
  };

  async function saveQuestion(gapId: string) {
    setError(null);
    const nextPrompt = draftQuestions[gapId]?.trim();
    if (!nextPrompt) return;

    setBusyGapId(gapId);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps/${gapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: nextPrompt }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyGapId(null);
    }
  }

  async function resolveGap(gapId: string) {
    setError(null);
    const selected = resolveSelections[gapId]?.trim();
    if (!selected) {
      setError("Select an observation before marking this question answered.");
      return;
    }

    setBusyGapId(gapId);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps/${gapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Resolved", resolvedByInternalInputId: selected }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyGapId(null);
    }
  }

  async function reopenGap(gapId: string) {
    setError(null);
    setBusyGapId(gapId);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps/${gapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Open" }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyGapId(null);
    }
  }

  const copyQuestion = async (gap: Gap) => {
    const question = draftQuestions[gap.id] ?? gap.prompt;

    try {
      await navigator.clipboard.writeText(question);
      setCopiedId(gap.id);
      window.setTimeout(() => setCopiedId((current) => (current === gap.id ? null : current)), 1600);
    } catch {
      setCopiedId(gap.id);
      window.setTimeout(() => setCopiedId((current) => (current === gap.id ? null : current)), 1600);
    }
  };

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
      <SurfaceCard className="min-w-0 overflow-hidden">
        <div className="border-b border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_45%,transparent)] px-6 py-5 sm:px-7">
          <ReviewToolbar
            className="border-0 bg-transparent px-0 py-0"
            left={
              <div className="space-y-1">
                <BackToIssueRecordLink issueId={issueId} className="mb-2" />
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Open questions</h2>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Full list of open and resolved questions. Use the issue record for day-to-day review; this page is for deeper ledger work.
                </p>
                <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                  For each open row: edit the drafted question as needed, then mark it answered once the answer exists as a saved observation. Reopen if the facts
                  move again.
                </p>
              </div>
            }
          />
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
          <section aria-label="Open question overview">
            <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)]">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Overview</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={cn(LEDGER_ROW_CHIP, summaryStatusChipClass.Open)}>{openCount} open</span>
                <span className={cn(LEDGER_ROW_CHIP, summaryStatusChipClass.Resolved)}>{resolvedCount} resolved</span>
                <span className={cn(LEDGER_ROW_CHIP, severityChipClass.Critical)}>{criticalOpenCount} critical open</span>
                {!openCountMatchesIssue ? (
                  <span
                    className={cn(
                      LEDGER_ROW_CHIP,
                      "border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_48%,transparent)] font-medium text-[--metis-status-danger-fg]",
                    )}
                  >
                    Count drift
                  </span>
                ) : null}
              </div>
              {!openCountMatchesIssue ? (
                <p className="mt-2 text-xs leading-relaxed text-[--metis-text-tertiary]">
                  The issue record open count doesn&apos;t match this ledger view. Refreshing should reconcile if a recent change hasn&apos;t propagated
                  yet.
                </p>
              ) : null}
            </div>
          </section>

          <CollapsibleFormPanel
            title="Register open question"
            description="Creates a saved open question record. Resolving links this question to a saved observation you select."
            addLabel="Add open question"
            form={<GapCreateForm issueId={issueId} />}
            secondaryAction={
              <Button asChild variant="outline">
                <Link href={`/issues/${issueId}`}>Workspace</Link>
              </Button>
            }
          >
            {error ? <p className="text-sm text-[--metis-status-danger-fg]">{error}</p> : null}
            <div className="space-y-5">
              <section aria-label="Open questions register" className="space-y-2.5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Open questions ({openGaps.length})</p>
                    <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                      Resolve by choosing the observation that answers the question; edit text as needed.
                    </p>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_72%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]">
                  {openGaps.map((gap) => {
                    const isEditing = editingId === gap.id;
                    const questionValue = draftQuestions[gap.id] ?? gap.prompt;
                    const expanded = openId === gap.id || isEditing;
                    const affects = gap.linkedSection ?? "—";
                    const stakeholder = gap.stakeholder ?? "—";
                    const why = (gap.whyItMatters ?? "").trim();
                    const promptPreview = clampText(questionValue || gap.prompt, 160);

                    return (
                      <div
                        id={gap.id}
                        key={gap.id}
                        className={cn(
                          "border-t border-[--metis-outline-subtle] px-4 py-3 first:border-t-0 sm:px-5",
                          !expanded && "hover:bg-[color-mix(in_oklab,var(--metis-surface-elevated)_24%,transparent)]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenId((cur) => (cur === gap.id ? null : gap.id))}
                          className="flex w-full items-start justify-between gap-4 text-left"
                          aria-expanded={expanded}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <RecordCodeHint
                                codeLabel={gapRecordBadgeLabel(gap)}
                                hint={(gap.prompt ?? gap.title ?? "").trim() || null}
                                className={cn(LEDGER_ROW_CHIP, GAP_RECORD_CHIP_CLASS)}
                              >
                                {gapRecordBadgeLabel(gap)}
                              </RecordCodeHint>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Severity</span>
                              <span className={cn(LEDGER_ROW_CHIP, severityChipClass[gap.severity] ?? severityChipClass.Watch)}>
                                {gap.severity}
                              </span>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</span>
                              <span
                                className={cn(LEDGER_ROW_CHIP, registerStatusChipClass[gap.status] ?? registerStatusChipClass.Open)}
                              >
                                {gap.status}
                              </span>
                            </div>

                            <p className="mt-2 text-sm font-medium leading-6 text-[--metis-paper] sm:text-[0.95rem]">{gap.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">{promptPreview}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[--metis-paper-muted]">
                              <span className="text-[--metis-text-tertiary]">Brief section:</span>
                              <span>{affects}</span>
                              <span className="text-[--metis-outline-strong]">•</span>
                              <span className="text-[--metis-text-tertiary]">Stakeholder role:</span>
                              <span>{stakeholder}</span>
                            </div>
                          </div>

                          <div className="mt-1 flex shrink-0 items-center gap-2 text-[--metis-text-tertiary]">
                            <span className="text-xs">{expanded ? "Hide" : "Details"}</span>
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>

                        {expanded ? (
                          <div
                            className={cn(
                              "mt-3 rounded-[1.2rem] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]",
                              rowTone[gap.status],
                            )}
                          >
                            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_252px] xl:gap-6">
                              <div className="min-w-0 space-y-4">
                                <DenseSection title="Why it matters" titleClassName="text-[0.62rem]" className="border-t-0 pt-0">
                                  <p className="text-sm leading-7 text-[--metis-paper-muted]">{why || "—"}</p>
                                </DenseSection>

                                <DenseSection title="Drafted question" titleClassName="text-[0.62rem]">
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={questionValue}
                                        onChange={(event) =>
                                          setDraftQuestions((current) => ({
                                            ...current,
                                            [gap.id]: event.target.value,
                                          }))
                                        }
                                        className="min-h-[140px] w-full rounded-[1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-4 text-sm leading-7 text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        <Button onClick={() => void saveQuestion(gap.id)} disabled={busyGapId === gap.id}>
                                          <Save className="mr-2 h-4 w-4" />
                                          Save
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingId(null)}>
                                          <X className="mr-2 h-4 w-4" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="whitespace-pre-wrap text-sm leading-7 text-[--metis-paper]">{gap.prompt}</p>
                                  )}
                                </DenseSection>
                              </div>

                              <div className="min-w-0 space-y-3 xl:border-l xl:border-[--metis-outline-subtle] xl:pl-6">
                                <DenseSection title="Brief section" titleClassName="text-[0.62rem]" className="border-t-0 pt-0">
                                  <p className="text-sm leading-6 text-[--metis-paper]">{affects}</p>
                                </DenseSection>
                                <DenseSection title="Stakeholder role" titleClassName="text-[0.62rem]">
                                  <p className="text-sm leading-6 text-[--metis-paper]">{stakeholder}</p>
                                </DenseSection>
                                <DenseSection title="Resolution" titleClassName="text-[0.62rem]">
                                  <div className="space-y-3">
                                    {internalInputs.length === 0 ? (
                                      <NoObservationsEmptyState issueId={issueId} />
                                    ) : (
                                      <>
                                        <ObservationRequiredGuide issueId={issueId} />
                                        <label className="block space-y-2">
                                          <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                                            Answering observation
                                          </span>
                                          <select
                                            value={resolveSelections[gap.id] ?? ""}
                                            onChange={(e) =>
                                              setResolveSelections((current) => ({
                                                ...current,
                                                [gap.id]: e.target.value,
                                              }))
                                            }
                                            className="h-11 max-w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                          >
                                            <option value="">Select observation…</option>
                                            {internalInputs.map((i) => (
                                              <option key={i.id} value={i.id}>
                                                {internalInputOptionLabelById.get(i.id) ?? observationSelectLabel(i)}
                                              </option>
                                            ))}
                                          </select>
                                        </label>
                                        <Button
                                          variant="outline"
                                          disabled={busyGapId === gap.id || !(resolveSelections[gap.id]?.trim())}
                                          onClick={() => void resolveGap(gap.id)}
                                          className="w-full justify-start"
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Mark answered with observation
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </DenseSection>

                                <div className="grid gap-2 pt-1">
                                  <Button variant="outline" onClick={() => startEditing(gap)} className="w-full justify-start">
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    Edit question
                                  </Button>
                                  <Button variant="outline" onClick={() => void copyQuestion(gap)} className="w-full justify-start">
                                    <Copy className="mr-2 h-4 w-4" />
                                    {copiedId === gap.id ? "Copied" : "Copy question"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {openGaps.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[--metis-paper-muted] sm:px-5">No open questions right now.</div>
                  ) : null}
                </div>
              </section>

              <details className="rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_34%,transparent)] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)] sm:px-5">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Resolved ({resolvedGaps.length})</p>
                      <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">
                        Resolved questions are kept for audit. Reopen only if the facts move again.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[--metis-text-tertiary]">
                      <span className="text-xs">Toggle</span>
                      <ChevronRight className="h-4 w-4" />
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </summary>
                <div className="mt-4 rounded-[1.15rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_72%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_10%,transparent)]">
                  {resolvedGaps.map((gap) => {
                    const isEditing = editingId === gap.id;
                    const questionValue = draftQuestions[gap.id] ?? gap.prompt;
                    const expanded = openId === gap.id || isEditing;
                    const affects = gap.linkedSection ?? "—";
                    const stakeholder = gap.stakeholder ?? "—";
                    const why = (gap.whyItMatters ?? "").trim();
                    const promptPreview = clampText(questionValue || gap.prompt, 160);
                    const resolvedBy = gap.resolvedByInternalInputId ?? null;
                    const resolvedObservationLine = observationAttributionSecondary(resolvedBy, inputsById);

                    return (
                      <div
                        id={gap.id}
                        key={gap.id}
                        className={cn(
                          "border-t border-[--metis-outline-subtle] px-4 py-3 first:border-t-0 sm:px-5",
                          !expanded && "hover:bg-[color-mix(in_oklab,var(--metis-surface-elevated)_22%,transparent)]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenId((cur) => (cur === gap.id ? null : gap.id))}
                          className="flex w-full items-start justify-between gap-4 text-left"
                          aria-expanded={expanded}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <RecordCodeHint
                                codeLabel={gapRecordBadgeLabel(gap)}
                                hint={(gap.prompt ?? gap.title ?? "").trim() || null}
                                className={cn(LEDGER_ROW_CHIP, GAP_RECORD_CHIP_CLASS)}
                              >
                                {gapRecordBadgeLabel(gap)}
                              </RecordCodeHint>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Severity</span>
                              <span className={cn(LEDGER_ROW_CHIP, severityChipClass[gap.severity] ?? severityChipClass.Watch)}>{gap.severity}</span>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</span>
                              <span
                                className={cn(LEDGER_ROW_CHIP, registerStatusChipClass[gap.status] ?? registerStatusChipClass.Open)}
                              >
                                {gap.status}
                              </span>
                              <span
                                className={cn(
                                  LEDGER_ROW_CHIP,
                                  "max-w-[min(100%,20rem)] truncate border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)] font-normal text-[--metis-text-secondary]",
                                )}
                                title={resolvedObservationLine ?? undefined}
                              >
                                Observation · {resolvedObservationLine ?? "—"}
                              </span>
                            </div>

                            <p className="mt-2 text-sm font-medium leading-6 text-[--metis-paper] sm:text-[0.95rem]">{gap.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">{promptPreview}</p>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[--metis-paper-muted]">
                              <span className="text-[--metis-text-tertiary]">Brief section:</span>
                              <span>{affects}</span>
                              <span className="text-[--metis-outline-strong]">•</span>
                              <span className="text-[--metis-text-tertiary]">Stakeholder role:</span>
                              <span>{stakeholder}</span>
                            </div>
                          </div>

                          <div className="mt-1 flex shrink-0 items-center gap-2 text-[--metis-text-tertiary]">
                            <span className="text-xs">{expanded ? "Hide" : "Details"}</span>
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>

                        {expanded ? (
                          <div
                            className={cn(
                              "mt-3 rounded-[1.2rem] px-4 py-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_12%,transparent)]",
                              rowTone[gap.status],
                            )}
                          >
                            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_252px] xl:gap-6">
                              <div className="min-w-0 space-y-4">
                                <DenseSection title="Why it matters" titleClassName="text-[0.62rem]" className="border-t-0 pt-0">
                                  <p className="text-sm leading-7 text-[--metis-paper-muted]">{why || "—"}</p>
                                </DenseSection>

                                <DenseSection title="Drafted question" titleClassName="text-[0.62rem]">
                                  <p className="whitespace-pre-wrap text-sm leading-7 text-[--metis-paper]">{gap.prompt}</p>
                                </DenseSection>
                              </div>

                              <div className="min-w-0 space-y-3 xl:border-l xl:border-[--metis-outline-subtle] xl:pl-6">
                                <DenseSection title="Attribution reference" titleClassName="text-[0.62rem]" className="border-t-0 pt-0">
                                  <p className="text-sm leading-6 text-[--metis-paper-muted]">
                                    Answered by <span className="text-[--metis-paper]">{resolvedObservationLine ?? "—"}</span>
                                  </p>
                                </DenseSection>
                                <DenseSection title="Resolution" titleClassName="text-[0.62rem]">
                                  <div className="space-y-2">
                                    <p className="text-xs text-[--metis-paper-muted]">Reopen only if the facts move again.</p>
                                    <Button
                                      variant="outline"
                                      disabled={busyGapId === gap.id}
                                      onClick={() => void reopenGap(gap.id)}
                                      className="w-full justify-start"
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                      Reopen question
                                    </Button>
                                  </div>
                                </DenseSection>
                                <div className="grid gap-2 pt-1">
                                  <Button variant="outline" onClick={() => void copyQuestion(gap)} className="w-full justify-start">
                                    <Copy className="mr-2 h-4 w-4" />
                                    {copiedId === gap.id ? "Copied" : "Copy question"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  {resolvedGaps.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-[--metis-paper-muted] sm:px-5">No resolved questions yet.</div>
                  ) : null}
                </div>
              </details>
            </div>
          </CollapsibleFormPanel>
        </div>
      </SurfaceCard>

      <SurfaceCard className="metis-support-surface min-w-0 overflow-hidden">
        <div className="space-y-4 px-5 py-5">
          <ReviewRailCard
            title="By section"
            tone="info"
            meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Where open questions are accumulating.</p>}
          >
            <div className="space-y-3">
              {sectionPressure.map((item) => (
                <div key={item.section} className="rounded-[1.15rem] border border-[--metis-info-border] bg-[--metis-info-bg] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[--metis-paper]">{item.section}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        {item.open} open · {item.resolved} resolved
                      </p>
                    </div>
                    <span
                      className={cn(
                        LEDGER_ROW_CHIP,
                        item.open > 0 ? summaryStatusChipClass.Open : summaryStatusChipClass.Resolved,
                      )}
                    >
                      {item.open > 0 ? "Open" : "Clear"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ReviewRailCard>

          <ReviewRailCard title="Counts" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Sanity-check ledger totals.</p>}>
            <div className="space-y-3 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[--metis-paper]">Observation records</span>
                <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                  {internalInputs.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[--metis-outline-subtle] pt-3">
                <span className="text-[--metis-paper]">Resolved open questions</span>
                <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                  {resolvedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[--metis-outline-subtle] pt-3">
                <span className="text-[--metis-paper]">Open count (issue record)</span>
                <Badge className="border-0 bg-[color-mix(in_oklab,var(--metis-surface-elevated)_70%,transparent)] text-[--metis-text-secondary]">
                  {issueOpenGapsCount}
                </Badge>
              </div>
            </div>
          </ReviewRailCard>

          <ReviewRailCard
            title="Next"
            tone="info"
            meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Jump to related registers and outputs.</p>}
          >
            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={observationInputPageHref}>
                  Add observation<span aria-hidden> →</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/issues/${issueId}/sources`}>Sources</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/issues/${issueId}`}>Workspace</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/issues/${issueId}/brief?mode=full`}>Open brief</Link>
              </Button>
            </div>
          </ReviewRailCard>
        </div>
      </SurfaceCard>
    </div>
  );
}
