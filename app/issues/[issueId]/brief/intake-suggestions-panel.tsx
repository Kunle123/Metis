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

export function IntakeSuggestionsPanel({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [bundle, setBundle] = useState<IntakeSuggestionBundle | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const [sourceState, setSourceState] = useState<Record<number, ItemState>>({});
  const [gapState, setGapState] = useState<Record<number, ItemState>>({});

  useEffect(() => {
    setBundle(getBundle(issueId));
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
                  const missing =
                    !gap.title?.trim() ||
                    !gap.whyItMatters?.trim() ||
                    !gap.stakeholder?.trim() ||
                    !gap.linkedSection?.trim() ||
                    !gap.prompt?.trim() ||
                    !gap.severity;
                  return (
                    <div key={`${gap.title ?? "gap"}-${idx}`} className="space-y-2 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[--metis-paper]">{gap.title ?? "Untitled gap"}</p>
                          <p className="mt-1 text-xs text-[--metis-paper-muted]">
                            Severity: {gap.severity ?? "—"}
                            {gap.stakeholder ? ` · Stakeholder: ${gap.stakeholder}` : ""}
                            {gap.linkedSection ? ` · Section: ${gap.linkedSection}` : ""}
                          </p>
                          {gap.prompt ? <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">{gap.prompt}</p> : null}
                          {gap.whyItMatters ? (
                            <p className="mt-1 text-xs leading-6 text-[--metis-paper-muted] whitespace-pre-wrap">Why: {gap.whyItMatters}</p>
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          className="h-9 rounded-full px-4"
                          disabled={st === "creating" || st === "created" || missing}
                          onClick={async () => {
                            setGapState((m) => ({ ...m, [idx]: { status: "creating" } }));
                            try {
                              const res = await fetch(`/api/issues/${issueId}/gaps`, {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                  title: gap.title,
                                  whyItMatters: gap.whyItMatters,
                                  stakeholder: gap.stakeholder,
                                  linkedSection: gap.linkedSection,
                                  severity: gap.severity,
                                  prompt: gap.prompt,
                                }),
                              });
                              const data = (await res.json().catch(() => ({}))) as { error?: string };
                              if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
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
                      {missing ? (
                        <p className="text-xs text-[--metis-paper-muted]">Needs all required fields (including severity) before it can be created.</p>
                      ) : null}
                      {gapState[idx]?.status === "error" ? <p className="text-xs text-rose-100">{gapState[idx]?.message ?? "Failed."}</p> : null}
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

