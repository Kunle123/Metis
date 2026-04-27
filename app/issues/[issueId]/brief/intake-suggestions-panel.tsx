"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type SuggestedSource = {
  title: string | null;
  note: string | null;
  snippet: string | null;
  tier: "Official" | "Internal" | "Major media" | "Market signal" | null;
  reliability: string | null;
  linkedSection: string | null;
  whyThisIsEvidence: string | null;
};

type SuggestedGap = {
  title: string | null;
  whyItMatters: string | null;
  stakeholder: string | null;
  linkedSection: string | null;
  prompt: string | null;
  severity: "Critical" | "Important" | "Watch" | null;
};

type IntakeSuggestionBundle = {
  suggestedSources: SuggestedSource[];
  suggestedGaps: SuggestedGap[];
  createdAt: number;
};

function getBundle(issueId: string): IntakeSuggestionBundle | null {
  try {
    const anyWindow = window as any;
    const root = anyWindow.__metisIntakeSuggestions as Record<string, IntakeSuggestionBundle> | undefined;
    const bundle = root?.[issueId];
    if (!bundle) return null;
    if (!Array.isArray(bundle.suggestedSources) || !Array.isArray(bundle.suggestedGaps)) return null;
    return bundle;
  } catch {
    return null;
  }
}

function clearBundle(issueId: string) {
  try {
    const anyWindow = window as any;
    if (!anyWindow.__metisIntakeSuggestions) return;
    delete anyWindow.__metisIntakeSuggestions[issueId];
  } catch {
    // ignore
  }
}

type ItemState = { status: "idle" | "creating" | "created" | "error"; message?: string };

type GapDraft = {
  title: string;
  whyItMatters: string;
  stakeholder: string;
  linkedSection: string;
  prompt: string;
  severity: "" | "Critical" | "Important" | "Watch";
};

function toGapDraft(g: SuggestedGap): GapDraft {
  return {
    title: (g.title ?? "").trim(),
    whyItMatters: (g.whyItMatters ?? "").trim(),
    stakeholder: (g.stakeholder ?? "").trim(),
    linkedSection: (g.linkedSection ?? "").trim(),
    prompt: (g.prompt ?? "").trim(),
    severity: (g.severity ?? "") as GapDraft["severity"],
  };
}

function missingGapFields(d: GapDraft) {
  const missing: string[] = [];
  if (!d.title.trim()) missing.push("title");
  if (!d.prompt.trim()) missing.push("prompt");
  if (!d.whyItMatters.trim()) missing.push("why it matters");
  if (!d.stakeholder.trim()) missing.push("stakeholder");
  if (!d.severity) missing.push("severity");
  return missing;
}

function formatApiError(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const anyData = data as any;
    const base = typeof anyData.error === "string" ? anyData.error : fallback;
    const issues = Array.isArray(anyData.issues) ? anyData.issues : null;
    if (issues && issues.length) {
      const details = issues
        .map((i: any) => {
          const path = Array.isArray(i.path) ? i.path.join(".") : "";
          const msg = typeof i.message === "string" ? i.message : "Invalid value";
          return path ? `${path}: ${msg}` : msg;
        })
        .filter(Boolean)
        .slice(0, 6);
      return `${base}${details.length ? `\n${details.join("\n")}` : ""}`;
    }
    return base;
  }
  return fallback;
}

export function IntakeSuggestionsPanel({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [bundle, setBundle] = useState<IntakeSuggestionBundle | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const [sourceState, setSourceState] = useState<Record<number, ItemState>>({});
  const [gapState, setGapState] = useState<Record<number, ItemState>>({});
  const [gapDraftByIdx, setGapDraftByIdx] = useState<Record<number, GapDraft>>({});

  useEffect(() => {
    const next = getBundle(issueId);
    setBundle(next);
    if (next?.suggestedGaps?.length) {
      setGapDraftByIdx((cur) => {
        const out: Record<number, GapDraft> = { ...cur };
        next.suggestedGaps.forEach((g, idx) => {
          if (!out[idx]) out[idx] = toGapDraft(g);
        });
        return out;
      });
    }
  }, [issueId]);

  const hasAny = Boolean((bundle?.suggestedSources.length ?? 0) > 0 || (bundle?.suggestedGaps.length ?? 0) > 0);
  const createdCount = useMemo(() => {
    const s = Object.values(sourceState).filter((x) => x.status === "created").length;
    const g = Object.values(gapState).filter((x) => x.status === "created").length;
    return s + g;
  }, [gapState, sourceState]);

  if (!bundle || !hasAny) return null;

  return (
    <div className="space-y-4 border-b border-white/8 bg-[rgba(255,255,255,0.012)] px-6 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[--metis-paper]">Intake suggestions</p>
          <p className="text-sm leading-6 text-[--metis-paper-muted]">
            Review and create sources or clarification gaps. Nothing is created automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={() => setIsOpen((v) => !v)}>
            {isOpen ? "Hide" : "Review"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-white/10 bg-white/[0.03] px-4 text-[--metis-paper] hover:bg-white/[0.08]"
            onClick={() => {
              clearBundle(issueId);
              setBundle(null);
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>

      {createdCount > 0 ? <p className="text-xs text-[--metis-paper-muted]">{createdCount} created this session.</p> : null}

      {isOpen ? (
        <div className="space-y-6 pt-2">
          {bundle.suggestedSources.length ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Suggested sources</p>
              <div className="space-y-4">
                {bundle.suggestedSources.map((src, idx) => {
                  const st = sourceState[idx]?.status ?? "idle";
                  const missing = !src.title?.trim() || !src.note?.trim() || !src.tier;
                  return (
                    <div key={`${src.title ?? "source"}-${idx}`} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">{src.title ?? "Untitled source"}</p>
                          <p className="mt-1 text-xs text-[--metis-paper-muted]">
                            Tier: {src.tier ?? "—"}
                            {src.linkedSection ? ` · Section: ${src.linkedSection}` : ""}
                            {src.reliability ? ` · Reliability: ${src.reliability}` : ""}
                          </p>
                          {src.note ? <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">{src.note}</p> : null}
                          {src.whyThisIsEvidence ? (
                            <p className="mt-1 text-xs leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">Why: {src.whyThisIsEvidence}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          className="h-9 rounded-full px-4"
                          disabled={st === "creating" || st === "created" || missing}
                          onClick={async () => {
                            setSourceState((m) => ({ ...m, [idx]: { status: "creating" } }));
                            try {
                              const res = await fetch(`/api/issues/${issueId}/sources`, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                  tier: src.tier,
                                  title: src.title,
                                  note: src.note,
                                  snippet: src.snippet ?? null,
                                  reliability: src.reliability ?? null,
                                  linkedSection: src.linkedSection ?? null,
                                  url: null,
                                  timestampLabel: null,
                                }),
                              });
                              const data = (await res.json().catch(() => ({}))) as { error?: string };
                              if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
                              setSourceState((m) => ({ ...m, [idx]: { status: "created" } }));
                              router.refresh();
                            } catch (e: unknown) {
                              setSourceState((m) => ({ ...m, [idx]: { status: "error", message: (e as Error)?.message ?? "Failed." } }));
                            }
                          }}
                        >
                          {st === "created" ? "Created" : st === "creating" ? "Creating…" : "Create source"}
                        </Button>
                      </div>
                      {missing ? (
                        <p className="text-xs text-[--metis-paper-muted]">Needs title, note, and tier before it can be created.</p>
                      ) : null}
                      {sourceState[idx]?.status === "error" ? (
                        <p className="text-xs text-rose-100">{sourceState[idx]?.message ?? "Failed."}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {bundle.suggestedGaps.length ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Suggested clarification gaps</p>
              <div className="space-y-4">
                {bundle.suggestedGaps.map((gap, idx) => {
                  const st = gapState[idx]?.status ?? "idle";
                  const draft = gapDraftByIdx[idx] ?? toGapDraft(gap);
                  const missing = missingGapFields(draft);
                  const disabled = st === "creating" || st === "created" || missing.length > 0;
                  return (
                    <div key={`${gap.title ?? "gap"}-${idx}`} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">{draft.title || gap.title || "Untitled gap"}</p>
                          <p className="mt-1 text-xs text-[--metis-paper-muted]">
                            Severity: {draft.severity || gap.severity || "—"}
                            {draft.stakeholder ? ` · Stakeholder: ${draft.stakeholder}` : ""}
                            {draft.linkedSection ? ` · Relates to: ${draft.linkedSection}` : ""}
                          </p>
                          {draft.prompt ? <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">{draft.prompt}</p> : null}
                          {draft.whyItMatters ? (
                            <p className="mt-1 text-xs leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">Why: {draft.whyItMatters}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          className="h-9 rounded-full px-4"
                          disabled={disabled}
                          onClick={async () => {
                            setGapState((m) => ({ ...m, [idx]: { status: "creating" } }));
                            try {
                              const res = await fetch(`/api/issues/${issueId}/gaps`, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                  title: draft.title,
                                  whyItMatters: draft.whyItMatters,
                                  stakeholder: draft.stakeholder,
                                  linkedSection: draft.linkedSection.trim() ? draft.linkedSection : null,
                                  severity: draft.severity,
                                  prompt: draft.prompt,
                                }),
                              });
                              const data = (await res.json().catch(() => ({}))) as unknown;
                              if (!res.ok) throw new Error(formatApiError(data, `Request failed (${res.status})`));
                              setGapState((m) => ({ ...m, [idx]: { status: "created" } }));
                              router.refresh();
                            } catch (e: unknown) {
                              setGapState((m) => ({ ...m, [idx]: { status: "error", message: (e as Error)?.message ?? "Failed." } }));
                            }
                          }}
                        >
                          {st === "created" ? "Created" : st === "creating" ? "Creating…" : "Create gap"}
                        </Button>
                      </div>
                      <div className="grid gap-2 rounded-[1.1rem] border border-white/8 bg-white/[0.02] px-3 py-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Title</span>
                            <input
                              value={draft.title}
                              onChange={(e) => setGapDraftByIdx((m) => ({ ...m, [idx]: { ...draft, title: e.target.value } }))}
                              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                              placeholder="What is missing?"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Severity</span>
                            <select
                              value={draft.severity}
                              onChange={(e) =>
                                setGapDraftByIdx((m) => ({
                                  ...m,
                                  [idx]: { ...draft, severity: e.target.value as GapDraft["severity"] },
                                }))
                              }
                              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                            >
                              <option value="">Select…</option>
                              <option value="Critical">Critical</option>
                              <option value="Important">Important</option>
                              <option value="Watch">Watch</option>
                            </select>
                          </label>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Stakeholder</span>
                            <input
                              value={draft.stakeholder}
                              onChange={(e) => setGapDraftByIdx((m) => ({ ...m, [idx]: { ...draft, stakeholder: e.target.value } }))}
                              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                              placeholder="Who needs the answer?"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Affects / relates to (optional)</span>
                            <input
                              value={draft.linkedSection}
                              onChange={(e) => setGapDraftByIdx((m) => ({ ...m, [idx]: { ...draft, linkedSection: e.target.value } }))}
                              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                              placeholder="e.g., student comms, legal line, customer impact"
                            />
                            <p className="text-xs leading-5 text-[--metis-paper-muted]">
                              The message, audience, or topic this unresolved question may affect — e.g. student comms, legal line, customer impact, chronology,
                              executive recommendation.
                            </p>
                          </label>
                        </div>

                        <label className="space-y-1">
                          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Prompt</span>
                          <textarea
                            value={draft.prompt}
                            onChange={(e) => setGapDraftByIdx((m) => ({ ...m, [idx]: { ...draft, prompt: e.target.value } }))}
                            className="min-h-[64px] w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                            placeholder="Phrase as a question or verification task."
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[--metis-ink-soft]">Why it matters</span>
                          <textarea
                            value={draft.whyItMatters}
                            onChange={(e) => setGapDraftByIdx((m) => ({ ...m, [idx]: { ...draft, whyItMatters: e.target.value } }))}
                            className="min-h-[56px] w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[--metis-paper] outline-none focus:border-white/18"
                            placeholder="What decision/risk does this affect?"
                          />
                        </label>
                      </div>

                      {missing.length ? (
                        <p className="text-xs text-[--metis-paper-muted]">
                          Missing: <span className="text-[--metis-paper]">{missing.join(", ")}</span>
                        </p>
                      ) : null}
                      {gapState[idx]?.status === "error" ? (
                        <p className="text-xs whitespace-pre-wrap text-rose-100">{gapState[idx]?.message ?? "Failed."}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

