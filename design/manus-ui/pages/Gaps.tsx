/*
 * Metis design reminder for this file:
 * Editorial Situation Room. Gaps is the clarification ledger for the brief.
 * Keep one dominant work area, use strong open/resolved contrast, and avoid task-manager behavior.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Copy, MessageSquareText, PencilLine } from "lucide-react";
import { MetisShell, SectionEyebrow, SurfaceCard } from "@/components/MetisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { gapItems, stakeholderInputs } from "@/lib/metis-data";
import { cn } from "@/lib/utils";

type GapRecord = (typeof gapItems)[number];

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

export default function Gaps() {
  const [gaps, setGaps] = useState<GapRecord[]>(() => gapItems.map((gap) => ({ ...gap })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            const current = map.get(item.linkedSection) ?? { section: item.linkedSection, open: 0, resolved: 0 };

            if (item.status === "Resolved") {
              current.resolved += 1;
            } else {
              current.open += 1;
            }

            map.set(item.linkedSection, current);
            return map;
          }, new Map<string, { section: string; open: number; resolved: number }>())
          .values(),
      ).sort((a, b) => b.open - a.open || a.section.localeCompare(b.section)),
    [gaps],
  );

  const startEditing = (gap: GapRecord) => {
    setEditingId(gap.id);
    setDraftQuestions((current) => ({
      ...current,
      [gap.id]: current[gap.id] ?? gap.prompt,
    }));
  };

  const saveQuestion = (gapId: string) => {
    const nextPrompt = draftQuestions[gapId]?.trim();
    if (!nextPrompt) return;

    setGaps((current) => current.map((gap) => (gap.id === gapId ? { ...gap, prompt: nextPrompt } : gap)));
    setEditingId(null);
  };

  const resolveGap = (gapId: string) => {
    setGaps((current) => current.map((gap) => (gap.id === gapId ? { ...gap, status: "Resolved" } : gap)));
    if (editingId === gapId) setEditingId(null);
  };

  const copyQuestion = async (gap: GapRecord) => {
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
    <MetisShell activePath="/gaps" pageTitle="Gaps" readinessState="Open gap" gapCount={openCount}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_312px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-white/8 bg-[rgba(255,255,255,0.025)] px-6 py-5 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-[Cormorant_Garamond] text-[2rem] leading-none text-[--metis-paper]">Clarification gaps</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-[rgba(124,78,18,0.6)] text-amber-50">{openCount} open</Badge>
                <Badge className="border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50">{resolvedCount} resolved</Badge>
                <Badge className="border-0 bg-[rgba(132,26,42,0.62)] text-rose-50">{criticalOpenCount} critical</Badge>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <div className="space-y-4">
              {gaps.map((gap) => {
                const isEditing = editingId === gap.id;
                const questionValue = draftQuestions[gap.id] ?? gap.prompt;

                return (
                  <article
                    key={gap.id}
                    className={cn(
                      "rounded-[1.55rem] border px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                      rowTone[gap.status],
                    )}
                  >
                    <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_252px] xl:gap-6">
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">{gap.id}</Badge>
                          <Badge className={severityTone[gap.severity]}>{gap.severity}</Badge>
                          <Badge className={statusTone[gap.status]}>{gap.status}</Badge>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Missing</p>
                          <h3 className="text-[1.35rem] font-medium leading-8 text-[--metis-paper]">{gap.title}</h3>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Impact</p>
                          <p className="text-sm leading-7 text-[--metis-paper-muted]">{gap.whyItMatters}</p>
                        </div>

                        <div className="rounded-[1.2rem] border border-white/12 bg-[rgba(255,255,255,0.06)] px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Drafted question</p>
                            {isEditing ? (
                              <span className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-brass-soft]">Editing</span>
                            ) : null}
                          </div>

                          {isEditing ? (
                            <div className="mt-3 space-y-3">
                              <Textarea
                                value={questionValue}
                                onChange={(event) =>
                                  setDraftQuestions((current) => ({
                                    ...current,
                                    [gap.id]: event.target.value,
                                  }))
                                }
                                className="min-h-[140px] rounded-[1rem] border-white/12 bg-[rgba(0,0,0,0.16)] px-4 py-4 text-sm leading-7 text-[--metis-paper]"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  onClick={() => saveQuestion(gap.id)}
                                  className="rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]"
                                >
                                  Save question
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                  className="rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-3 text-base leading-8 text-[--metis-paper]">{gap.prompt}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 xl:border-l xl:border-white/8 xl:pl-6">
                        <div className="metis-surface metis-support-surface space-y-3 rounded-[1.15rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div>
                            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Affected section</p>
                            <p className="mt-2 text-sm leading-6 text-[--metis-paper]">{gap.linkedSection}</p>
                          </div>
                          <div className="border-t border-white/8 pt-3">
                            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Stakeholder role</p>
                            <p className="mt-2 text-sm leading-6 text-[--metis-paper]">{gap.stakeholder}</p>
                          </div>
                        </div>

                        <div className="grid gap-3">
                          <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                            <Link href="/input">
                              <MessageSquareText className="mr-2 h-4 w-4" />
                              Add manual input
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => startEditing(gap)}
                            className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit question
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => copyQuestion(gap)}
                            className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {copiedId === gap.id ? "Copied" : "Copy question"}
                          </Button>
                          <Button
                            variant="outline"
                            disabled={gap.status === "Resolved"}
                            onClick={() => resolveGap(gap.id)}
                            className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08] disabled:opacity-60"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {gap.status === "Resolved" ? "Resolved" : "Mark resolved"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="metis-support-surface overflow-hidden">
          <div className="divide-y divide-white/8">
            <div className="space-y-3 px-5 py-5">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">By section</p>
              {sectionPressure.map((item) => (
                <div key={item.section} className="rounded-[1.15rem] border border-white/8 bg-[rgba(0,0,0,0.18)] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[--metis-paper]">{item.section}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">
                        {item.open} open · {item.resolved} resolved
                      </p>
                    </div>
                    <Badge
                      className={item.open > 0 ? "border-0 bg-[rgba(124,78,18,0.6)] text-amber-50" : "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50"}
                    >
                      {item.open > 0 ? "Open" : "Clear"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 px-5 py-5 text-sm leading-6 text-[--metis-paper-muted]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[--metis-paper]">Input records</span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{stakeholderInputs.length}</Badge>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                <span className="text-[--metis-paper]">Resolved gaps</span>
                <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{resolvedCount}</Badge>
              </div>
            </div>

            <div className="grid gap-3 px-5 py-5">
              <Button asChild className="w-full rounded-full bg-[--metis-brass] text-[--metis-dark] hover:bg-[--metis-brass-soft]">
                <Link href="/input">Add attributable input</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full border-white/10 bg-white/[0.03] text-[--metis-paper] hover:bg-white/[0.08]">
                <Link href="/compare">Open delta</Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </MetisShell>
  );
}
