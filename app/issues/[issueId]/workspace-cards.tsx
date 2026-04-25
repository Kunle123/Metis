"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, ChevronRight, Copy, ExternalLink, PencilLine, RotateCcw, Save, X } from "lucide-react";

type GapCardData = {
  id: string;
  prompt: string;
  whyItMatters: string | null;
  status: string | null;
  severity: string | null;
  stakeholder: string | null;
  section: string | null;
  resolvedByInternalInputId: string | null;
  createdAt: string;
};

type SourceCardData = {
  id: string;
  title: string | null;
  note: string | null;
  snippet: string | null;
  url: string | null;
  tier: string | null;
  section: string | null;
  reliability: string | null;
  observedAt: string | null;
  createdAt: string;
};

type ObservationCardData = {
  id: string;
  note: string;
  createdAt: string;
};

function clampText(s: string, max = 160) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function metaParts(parts: Array<string | null | undefined>) {
  return parts.filter((p) => (p ?? "").trim().length > 0) as string[];
}

function MetaLine({ parts }: { parts: Array<string | null | undefined> }) {
  const text = metaParts(parts).join(" · ");
  if (!text) return null;
  return <p className="text-xs text-white/50">{text}</p>;
}

function ActionButton({
  onClick,
  children,
  disabled,
  tone = "neutral",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-white/10 hover:bg-white/15 text-white"
      : tone === "danger"
        ? "bg-rose-900/25 hover:bg-rose-900/35 text-rose-50 border-rose-200/15"
        : "bg-white/5 hover:bg-white/10 text-white/80";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function ActionLink({
  href,
  children,
  target,
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function CardShell({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-white/[0.04]"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2 text-white/40">
          <span className="text-xs">{expanded ? "Hide" : "View details"}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
    </div>
  );
}

export function WorkspaceGapCards({
  issueId,
  gaps,
  internalInputs,
}: {
  issueId: string;
  gaps: GapCardData[];
  internalInputs: Array<{ id: string; role: string; name: string; createdAt: string }>;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPromptById, setDraftPromptById] = useState<Record<string, string>>({});
  const [resolveSelectionById, setResolveSelectionById] = useState<Record<string, string>>({});
  const [busyGapId, setBusyGapId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const inputLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of internalInputs) {
      const shortId = i.id.slice(0, 8);
      m.set(i.id, `${shortId}… · ${i.role} · ${i.name}`);
    }
    return m;
  }, [internalInputs]);

  function beginEdit(gap: GapCardData) {
    setEditingId(gap.id);
    setDraftPromptById((cur) => ({ ...cur, [gap.id]: cur[gap.id] ?? gap.prompt }));
    setErrorById((cur) => {
      const next = { ...cur };
      delete next[gap.id];
      return next;
    });
  }

  async function patchGap(gapId: string, body: unknown) {
    const res = await fetch(`/api/issues/${issueId}/gaps/${gapId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed (${res.status})`);
    }
    return res.json();
  }

  return (
    <div className="space-y-3">
      {gaps.map((g) => {
        const expanded = openId === g.id;
        const preview = clampText(g.prompt, 140);
        const isEditing = editingId === g.id;
        const draftPrompt = (draftPromptById[g.id] ?? g.prompt).trimEnd();
        const canEdit = (g.status ?? "") !== "Resolved";
        const isResolved = (g.status ?? "") === "Resolved";
        const resolvedByLabel = g.resolvedByInternalInputId
          ? inputLabelById.get(g.resolvedByInternalInputId) ?? g.resolvedByInternalInputId
          : null;

        return (
          <div key={g.id}>
            <CardShell
              expanded={expanded}
              onToggle={() => setOpenId((cur) => (cur === g.id ? null : g.id))}
            >
              <p className="text-sm font-medium text-white/90">{preview}</p>
              <div className="mt-1">
                <MetaLine
                  parts={[
                    g.status ? `Status: ${g.status}` : null,
                    g.severity ? `Severity: ${g.severity}` : null,
                    g.section ? `Section: ${g.section}` : null,
                    g.stakeholder ? `Stakeholder: ${g.stakeholder}` : null,
                  ]}
                />
              </div>

              {expanded ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-white/50">Drafted question</p>
                      {isEditing ? <span className="text-xs text-[--metis-brass-soft]">Editing</span> : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={draftPromptById[g.id] ?? g.prompt}
                          onChange={(e) =>
                            setDraftPromptById((cur) => ({
                              ...cur,
                              [g.id]: e.target.value,
                            }))
                          }
                          className="min-h-[120px] w-full rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <ActionButton
                            tone="primary"
                            disabled={busyGapId === g.id || draftPrompt.trim().length === 0}
                            onClick={async () => {
                              setBusyGapId(g.id);
                              setErrorById((cur) => ({ ...cur, [g.id]: "" }));
                              try {
                                await patchGap(g.id, { prompt: draftPrompt.trim() });
                                setEditingId(null);
                                router.refresh();
                              } catch (e) {
                                setErrorById((cur) => ({
                                  ...cur,
                                  [g.id]: e instanceof Error ? e.message : "Unknown error",
                                }));
                              } finally {
                                setBusyGapId(null);
                              }
                            }}
                          >
                            <Save size={14} />
                            Save
                          </ActionButton>
                          <ActionButton
                            disabled={busyGapId === g.id}
                            onClick={() => {
                              setEditingId(null);
                              setDraftPromptById((cur) => {
                                const next = { ...cur };
                                delete next[g.id];
                                return next;
                              });
                            }}
                          >
                            <X size={14} />
                            Cancel
                          </ActionButton>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/85">{g.prompt}</p>
                    )}
                  </div>

                  {g.whyItMatters ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Why it matters</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                        {g.whyItMatters}
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <p className="text-xs text-white/50">Resolution</p>
                    {isResolved ? (
                      <p className="mt-2 text-sm text-white/80">
                        Resolved by: <span className="text-white/90">{resolvedByLabel ?? "—"}</span>
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-white/70">
                          Select an observation record to mark this gap resolved.
                        </p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={resolveSelectionById[g.id] ?? ""}
                            onChange={(e) =>
                              setResolveSelectionById((cur) => ({
                                ...cur,
                                [g.id]: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                          >
                            <option value="">Select an observation…</option>
                            {internalInputs.map((i) => (
                              <option key={i.id} value={i.id}>
                                {inputLabelById.get(i.id) ?? i.id}
                              </option>
                            ))}
                          </select>
                          <ActionButton
                            tone="primary"
                            disabled={busyGapId === g.id || internalInputs.length === 0}
                            onClick={async () => {
                              const selected = (resolveSelectionById[g.id] ?? "").trim();
                              if (!selected) {
                                setErrorById((cur) => ({
                                  ...cur,
                                  [g.id]: "Select an observation before marking resolved.",
                                }));
                                return;
                              }
                              setBusyGapId(g.id);
                              setErrorById((cur) => ({ ...cur, [g.id]: "" }));
                              try {
                                await patchGap(g.id, { status: "Resolved", resolvedByInternalInputId: selected });
                                router.refresh();
                              } catch (e) {
                                setErrorById((cur) => ({
                                  ...cur,
                                  [g.id]: e instanceof Error ? e.message : "Unknown error",
                                }));
                              } finally {
                                setBusyGapId(null);
                              }
                            }}
                          >
                            <CheckCircle2 size={14} />
                            Mark resolved
                          </ActionButton>
                        </div>
                      </>
                    )}
                    {errorById[g.id] ? <p className="mt-2 text-sm text-rose-200">{errorById[g.id]}</p> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      disabled={!canEdit || busyGapId === g.id}
                      onClick={() => beginEdit(g)}
                    >
                      <PencilLine size={14} />
                      Edit question
                    </ActionButton>
                    <ActionButton
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(g.prompt);
                        } catch {
                          // best-effort
                        }
                      }}
                      disabled={busyGapId === g.id}
                    >
                      <Copy size={14} />
                      Copy question
                    </ActionButton>
                    {isResolved ? (
                      <ActionButton
                        disabled={busyGapId === g.id}
                        onClick={async () => {
                          setBusyGapId(g.id);
                          setErrorById((cur) => ({ ...cur, [g.id]: "" }));
                          try {
                            await patchGap(g.id, { status: "Open" });
                            router.refresh();
                          } catch (e) {
                            setErrorById((cur) => ({
                              ...cur,
                              [g.id]: e instanceof Error ? e.message : "Unknown error",
                            }));
                          } finally {
                            setBusyGapId(null);
                          }
                        }}
                      >
                        <RotateCcw size={14} />
                        Reopen
                      </ActionButton>
                    ) : null}
                    <ActionLink href={`/issues/${issueId}/gaps#${g.id}`}>
                      Advanced view
                    </ActionLink>
                  </div>
                </div>
              ) : null}
            </CardShell>
          </div>
        );
      })}
    </div>
  );
}

export function WorkspaceSourceCards({
  issueId,
  sources,
}: {
  issueId: string;
  sources: SourceCardData[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, SourceCardData>();
    for (const s of sources) m.set(s.id, s);
    return m;
  }, [sources]);

  return (
    <div className="space-y-3">
      {sources.map((s) => {
        const expanded = openId === s.id;
        const title = (s.title ?? "").trim() || "Source";
        const notePreview = clampText(s.note ?? s.snippet ?? "", 160);
        const fullNote = (s.note ?? "").trim();
        const fullSnippet = (s.snippet ?? "").trim();

        return (
          <div key={s.id}>
            <CardShell
              expanded={expanded}
              onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
            >
              <p className="text-sm font-medium text-white/90">{title}</p>
              <div className="mt-1">
                <MetaLine
                  parts={[
                    s.tier ? `Tier: ${s.tier}` : null,
                    s.section ? `Section: ${s.section}` : null,
                    s.reliability ? `Reliability: ${s.reliability}` : null,
                    s.observedAt ? `Observed: ${new Date(s.observedAt).toLocaleString()}` : null,
                  ]}
                />
              </div>
              {notePreview ? (
                <p className="mt-2 text-sm text-white/75">{notePreview}</p>
              ) : (
                <p className="mt-2 text-sm text-white/50">No note recorded.</p>
              )}

              {expanded ? (
                <div className="mt-3 space-y-3">
                  {fullNote ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Note</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{fullNote}</p>
                    </div>
                  ) : null}

                  {fullSnippet ? (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-xs text-white/50">Snippet</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{fullSnippet}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {s.url ? (
                      <ActionLink href={s.url} target="_blank">
                        <ExternalLink size={14} />
                        Open link
                      </ActionLink>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                        No link available
                      </span>
                    )}
                    <ActionLink href={`/issues/${issueId}/sources`}>Advanced view</ActionLink>
                  </div>
                </div>
              ) : null}
            </CardShell>
          </div>
        );
      })}
      {/* avoid unused var warning if tooling changes; keeping byId for easy future lookup */}
      {byId.size === -1 ? null : null}
    </div>
  );
}

export function WorkspaceObservationCards({ observations }: { observations: ObservationCardData[] }) {
  return (
    <div className="space-y-3">
      {observations.map((o) => (
        <div
          key={o.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
        >
          <p className="whitespace-pre-wrap text-sm text-white/85">{o.note}</p>
          <p className="mt-2 text-xs text-white/45">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

