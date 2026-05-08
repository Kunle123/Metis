"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  MessageSquareText,
  PencilLine,
  RotateCcw,
  Save,
  X,
} from "lucide-react";

import { SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DenseSection } from "@/components/review/DenseSection";
import { ReviewRailCard } from "@/components/review/ReviewRailCard";
import { ReviewToolbar } from "@/components/review/ReviewToolbar";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import { cn } from "@/lib/utils";
import type { Gap } from "@metis/shared/gap";

import { GapCreateForm } from "./gap-create-form";
import { CollapsibleFormPanel } from "../collapsible-form-panel";

type InternalInputListItem = {
  id: string;
  role: string;
  name: string;
  createdAt: string;
};

const severityTone: Record<string, string> = {
  Critical:
    "border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_55%,transparent)] text-[--metis-status-danger-fg]",
  Important:
    "border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_55%,transparent)] text-[--metis-status-warning-fg]",
  Watch:
    "border border-[--metis-status-neutral-border] bg-[color-mix(in_oklab,var(--metis-status-neutral-bg)_70%,transparent)] text-[--metis-status-neutral-fg]",
};

const statusTone: Record<string, string> = {
  Open:
    "border border-[--metis-status-warning-border] bg-[color-mix(in_oklab,var(--metis-status-warning-bg)_52%,transparent)] text-[--metis-status-warning-fg]",
  Resolved:
    "border border-[--metis-status-success-border] bg-[color-mix(in_oklab,var(--metis-status-success-bg)_52%,transparent)] text-[--metis-status-success-fg]",
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

  const internalInputLabelById = useMemo(() => {
    const map = new Map<string, string>();
    internalInputs.forEach((i) => {
      map.set(i.id, `${i.id.slice(0, 8)}… · ${i.role} · ${i.name}`);
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
      setError("Select an internal input record before marking an open question answered.");
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
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Open questions</h2>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Full list of open and resolved questions. Use the workspace for day-to-day review; this page is for deeper ledger work.
                </p>
                <p className="text-[0.72rem] leading-snug text-[--metis-paper-muted]">
                  For each open row: edit the drafted question as needed, then mark it answered when you have attributable input. Reopen if the
                  facts move again.
                </p>
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2 lg:justify-center">
              <Button asChild variant="outline" className="justify-start">
                <Link href={`/issues/${issueId}`}>Back to workspace</Link>
              </Button>
            </div>
          </ReviewToolbar>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
          <section aria-label="Open question overview">
            <div className="rounded-[1.1rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_38%,transparent)] px-4 py-3 sm:px-5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_14%,transparent)]">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Overview</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={statusTone.Open}>{openCount} open</Badge>
                <Badge className={statusTone.Resolved}>{resolvedCount} resolved</Badge>
                <Badge className={severityTone.Critical}>{criticalOpenCount} critical open</Badge>
                {!openCountMatchesIssue ? (
                  <Badge className="border border-[--metis-status-danger-border] bg-[color-mix(in_oklab,var(--metis-status-danger-bg)_48%,transparent)] text-[--metis-status-danger-fg]">
                    Count drift
                  </Badge>
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
            description="Creates a saved open question record. Resolving requires selecting an attributable observation."
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
                    <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">Resolve when you have attributable input; edit text as needed.</p>
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
                              <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{gap.id.slice(0, 8)}…</Badge>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Severity</span>
                              <Badge className={severityTone[gap.severity] ?? severityTone.Watch}>{gap.severity}</Badge>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</span>
                              <Badge className={statusTone[gap.status] ?? statusTone.Open}>{gap.status}</Badge>
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
                                  <div className="space-y-2">
                                    <p className="text-xs text-[--metis-paper-muted]">
                                      Mark answered only when you have attributable input. Create it first in{" "}
                                      <Link
                                        href={`/issues/${issueId}/input`}
                                        className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline"
                                      >
                                        Observations
                                      </Link>
                                      , then select it below.
                                    </p>
                                    <label className="block space-y-2">
                                      <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[--metis-text-tertiary]">
                                        Resolved by observation
                                      </span>
                                      <select
                                        value={resolveSelections[gap.id] ?? ""}
                                        onChange={(e) =>
                                          setResolveSelections((current) => ({
                                            ...current,
                                            [gap.id]: e.target.value,
                                          }))
                                        }
                                        className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                      >
                                        <option value="">Select an observation…</option>
                                        {internalInputs.map((i) => (
                                          <option key={i.id} value={i.id}>
                                            {internalInputLabelById.get(i.id) ?? `${i.id.slice(0, 8)}… · ${i.role} · ${i.name}`}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <Button
                                      variant="outline"
                                      disabled={busyGapId === gap.id || internalInputs.length === 0}
                                      onClick={() => void resolveGap(gap.id)}
                                      className="w-full justify-start"
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Mark answered
                                    </Button>
                                  </div>
                                </DenseSection>

                                <div className="grid gap-2 pt-1">
                                  <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={`/issues/${issueId}/input`}>
                                      <MessageSquareText className="mr-2 h-4 w-4" />
                                      Add attributable input
                                    </Link>
                                  </Button>
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
                    const resolvedLabel = resolvedBy ? internalInputLabelById.get(resolvedBy) ?? `${resolvedBy.slice(0, 8)}…` : null;

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
                              <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{gap.id.slice(0, 8)}…</Badge>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Severity</span>
                              <Badge className={severityTone[gap.severity] ?? severityTone.Watch}>{gap.severity}</Badge>
                              <span className="text-[0.62rem] uppercase tracking-[0.16em] text-[--metis-text-tertiary]">Status</span>
                              <Badge className={statusTone[gap.status] ?? statusTone.Open}>{gap.status}</Badge>
                              <Badge className="border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_48%,transparent)] text-[--metis-text-secondary]">
                                Resolved by · {resolvedLabel ?? "—"}
                              </Badge>
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
                                    Resolved by observation: <span className="text-[--metis-paper]">{resolvedLabel ?? resolvedBy ?? "—"}</span>
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
                    <Badge
                      className={
                        item.open > 0
                          ? statusTone.Open
                          : statusTone.Resolved
                      }
                    >
                      {item.open > 0 ? "Open" : "Clear"}
                    </Badge>
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
            meta={<p className="text-sm leading-6 text-[--metis-paper-muted]\">Jump to related registers and outputs.</p>}
          >
            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/issues/${issueId}/input`}>Add attributable input</Link>
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
