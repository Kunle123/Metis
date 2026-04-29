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
  Critical: "border-0 bg-[rgba(132,26,42,0.62)] text-rose-50",
  Important: "border-0 bg-[rgba(128,82,18,0.58)] text-amber-50",
  Watch: "border border-white/12 bg-[rgba(52,60,69,0.56)] text-slate-100",
};

const statusTone: Record<string, string> = {
  Open: "border-0 bg-[rgba(124,78,18,0.6)] text-amber-50",
  Resolved: "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50",
};

const rowTone: Record<string, string> = {
  Open: "border-[rgba(214,156,62,0.24)] bg-[linear-gradient(180deg,rgba(214,156,62,0.12),rgba(255,255,255,0.03))]",
  Resolved: "border-[rgba(40,140,96,0.22)] bg-[linear-gradient(180deg,rgba(32,110,78,0.14),rgba(255,255,255,0.03))]",
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

  const openCount = useMemo(() => gaps.filter((item) => item.status === "Open").length, [gaps]);
  const resolvedCount = useMemo(() => gaps.filter((item) => item.status === "Resolved").length, [gaps]);
  const criticalOpenCount = useMemo(
    () => gaps.filter((item) => item.status === "Open" && item.severity === "Critical").length,
    [gaps],
  );

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
      <SurfaceCard>
        <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
          <ReviewToolbar
            className="border-0 bg-transparent px-0 py-0"
            left={
              <div className="space-y-1">
                <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Open questions</h2>
                <p className="text-sm leading-6 text-[--metis-paper-muted]">
                  Full list of open and resolved questions. Use the workspace for day-to-day review; this page is for deeper ledger work.
                </p>
              </div>
            }
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">{openCount} open</Badge>
                <Badge className="border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50">{resolvedCount} resolved</Badge>
                <Badge className="border-0 bg-[rgba(132,26,42,0.62)] text-rose-50">{criticalOpenCount} critical</Badge>
                {!openCountMatchesIssue ? (
                  <Badge className="border-0 bg-rose-900/40 text-rose-100">Count drift</Badge>
                ) : null}
              </div>
            }
          >
            <div className="flex flex-wrap items-center gap-2 lg:justify-center">
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
              >
                <Link href={`/issues/${issueId}`}>Back to workspace</Link>
              </Button>
            </div>
          </ReviewToolbar>
        </div>

        <div className="px-6 py-6 sm:px-7 sm:py-7">
          <CollapsibleFormPanel
            title="Open questions"
            description="Review and mark answered when you have attributable input. Add a new open question only when needed."
            addLabel="Add open question"
            form={<GapCreateForm issueId={issueId} />}
            secondaryAction={
              <Button asChild variant="outline" className="h-10 rounded-full px-4">
                <Link href={`/issues/${issueId}`}>Workspace</Link>
              </Button>
            }
          >
            {error ? <p className="text-sm text-rose-200">{error}</p> : null}
            <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.035)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {gaps.map((gap) => {
                const isEditing = editingId === gap.id;
                const questionValue = draftQuestions[gap.id] ?? gap.prompt;
                const expanded = openId === gap.id || isEditing;
                const affects = gap.linkedSection ?? "—";
                const stakeholder = gap.stakeholder ?? "—";
                const why = (gap.whyItMatters ?? "").trim();
                const promptPreview = clampText(questionValue || gap.prompt, 160);
                const resolvedBy = gap.resolvedByInternalInputId ?? null;

                return (
                  <div
                    id={gap.id}
                    key={gap.id}
                    className={cn(
                      "border-t border-white/10 px-4 py-3 first:border-t-0 sm:px-5",
                      !expanded && "hover:bg-white/[0.02]",
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
                          <Badge className={severityTone[gap.severity] ?? severityTone.Watch}>{gap.severity}</Badge>
                          <Badge className={statusTone[gap.status] ?? statusTone.Open}>{gap.status}</Badge>
                          {gap.status === "Resolved" ? (
                            <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">
                              Resolved {resolvedBy ? `· ${resolvedBy.slice(0, 8)}…` : ""}
                            </Badge>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-medium leading-6 text-[--metis-paper] sm:text-[0.95rem]">{gap.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[--metis-paper-muted]">{promptPreview}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[--metis-paper-muted]">
                          <span className="text-[--metis-paper]">Relates:</span>
                          <span>{affects}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-[--metis-paper]">Stakeholder:</span>
                          <span>{stakeholder}</span>
                        </div>
                      </div>

                      <div className="mt-1 flex shrink-0 items-center gap-2 text-white/40">
                        <span className="text-xs">{expanded ? "Hide" : "Details"}</span>
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </button>

                    {expanded ? (
                      <div
                        className={cn(
                          "mt-3 rounded-[1.2rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                          rowTone[gap.status],
                        )}
                      >
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_252px] xl:gap-6">
                          <div className="space-y-4">
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
                                    <Button onClick={() => void saveQuestion(gap.id)} disabled={busyGapId === gap.id} className="rounded-full">
                                      <Save className="mr-2 h-4 w-4" />
                                      Save
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-full">
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

                          <div className="space-y-3 xl:border-l xl:border-white/8 xl:pl-6">
                            <DenseSection title="Affects / relates to" titleClassName="text-[0.62rem]" className="border-t-0 pt-0">
                              <p className="text-sm leading-6 text-[--metis-paper]">{affects}</p>
                            </DenseSection>
                            <DenseSection title="Stakeholder role" titleClassName="text-[0.62rem]">
                              <p className="text-sm leading-6 text-[--metis-paper]">{stakeholder}</p>
                            </DenseSection>
                            <DenseSection title="Resolution" titleClassName="text-[0.62rem]">
                              {gap.status === "Open" ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-[--metis-paper-muted]">Resolve with an attributable internal input record.</p>
                                  <select
                                    value={resolveSelections[gap.id] ?? ""}
                                    onChange={(e) =>
                                      setResolveSelections((current) => ({
                                        ...current,
                                        [gap.id]: e.target.value,
                                      }))
                                    }
                                    className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                  >
                                    <option value="">Select an input record…</option>
                                    {internalInputs.map((i) => (
                                      <option key={i.id} value={i.id}>
                                        {i.id.slice(0, 8)}… · {i.role} · {i.name}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    variant="outline"
                                    disabled={busyGapId === gap.id || internalInputs.length === 0}
                                    onClick={() => void resolveGap(gap.id)}
                                    className="w-full rounded-full"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark answered
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-[--metis-paper-muted]">
                                    Resolved by: <span className="text-[--metis-paper]">{resolvedBy ?? "—"}</span>
                                  </p>
                                  <Button
                                    variant="outline"
                                    disabled={busyGapId === gap.id}
                                    onClick={() => void reopenGap(gap.id)}
                                    className="w-full rounded-full"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reopen question
                                  </Button>
                                </div>
                              )}
                            </DenseSection>

                            <div className="grid gap-2 pt-1">
                              <Button asChild variant="outline" className="w-full rounded-full">
                                <Link href={`/issues/${issueId}/input`}>
                                  <MessageSquareText className="mr-2 h-4 w-4" />
                                  Add manual input
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => startEditing(gap)}
                                disabled={gap.status === "Resolved"}
                                className="w-full rounded-full"
                              >
                                <PencilLine className="mr-2 h-4 w-4" />
                                Edit question
                              </Button>
                              <Button variant="outline" onClick={() => void copyQuestion(gap)} className="w-full rounded-full">
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
            </div>
          </CollapsibleFormPanel>
        </div>
      </SurfaceCard>

      <SurfaceCard className="metis-support-surface">
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
                          ? "border-0 bg-[rgba(124,78,18,0.6)] text-amber-50"
                          : "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50"
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
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{internalInputs.length}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                <span className="text-[--metis-paper]">Resolved gaps</span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{resolvedCount}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                <span className="text-[--metis-paper]">Issue.openGapsCount</span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{issueOpenGapsCount}</Badge>
              </div>
            </div>
          </ReviewRailCard>

          <ReviewRailCard title="Next" tone="info" meta={<p className="text-sm leading-6 text-[--metis-paper-muted]">Add attributable observations used to resolve gaps.</p>}>
            <div className="grid gap-3">
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/issues/${issueId}/input`}>Add attributable input</Link>
              </Button>
            </div>
          </ReviewRailCard>
        </div>
      </SurfaceCard>
    </div>
  );
}
