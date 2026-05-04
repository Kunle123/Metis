"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  role: string;
  name: string;
  response: string;
  confidence: string;
  linkedSection: string | null;
  timestampLabel: string | null;
  visibility: string | null;
  excludedFromBrief: boolean;
  createdAt: string;
};

function clampText(s: string, max = 160) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

/** en-GB + Europe/London so SSR and initial client render match regardless of runtime locale / tz. */
function formatIsoInstantLondon(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function metaParts(parts: Array<string | null | undefined>) {
  return parts.filter((p) => (p ?? "").trim().length > 0) as string[];
}

function MetaLine({ parts }: { parts: Array<string | null | undefined> }) {
  const text = metaParts(parts).join(" · ");
  if (!text) return null;
  return <p className="text-xs text-white/50">{text}</p>;
}

function statusPillClass(status: string) {
  if (status === "Open") return "border-0 bg-[rgba(124,78,18,0.6)] text-amber-50";
  if (status === "Resolved") return "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50";
  return "border border-white/10 bg-white/6 text-white/80";
}

function severityPillClass(severity: string) {
  if (severity === "Critical") return "border-0 bg-[rgba(132,26,42,0.62)] text-rose-50";
  if (severity === "Important") return "border-0 bg-[rgba(128,82,18,0.58)] text-amber-50";
  if (severity === "Watch") return "border border-white/12 bg-[rgba(52,60,69,0.56)] text-slate-100";
  return "border border-white/10 bg-white/6 text-white/80";
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium", className)}>
      {children}
    </span>
  );
}

function ActionButton({
  onClick,
  children,
  disabled,
  tone = "neutral",
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "neutral" | "primary" | "danger";
  className?: string;
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
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50",
        toneClass,
        className,
      )}
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

function TertiaryActionLink({
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
      className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-xs text-white/60 hover:border-white/12 hover:bg-white/[0.04] hover:text-white/80"
    >
      {children}
    </Link>
  );
}

function CardShell({
  expanded,
  onToggle,
  summary,
  details,
}: {
  expanded: boolean;
  onToggle: () => void;
  summary: React.ReactNode;
  details?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-2.5 text-left hover:bg-white/[0.04]"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2 text-white/40">
          <span className="text-xs">{expanded ? "Hide" : "View details"}</span>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      {expanded && details ? <div className="border-t border-white/10 px-4 pb-3 pt-2.5">{details}</div> : null}
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
  const WHY_COLLAPSE_CHARS = 260;
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPromptById, setDraftPromptById] = useState<Record<string, string>>({});
  const [resolveSelectionById, setResolveSelectionById] = useState<Record<string, string>>({});
  const [busyGapId, setBusyGapId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [addObsOpenById, setAddObsOpenById] = useState<Record<string, boolean>>({});
  const [obsDraftByGapId, setObsDraftByGapId] = useState<
    Record<
      string,
      {
        role: string;
        name: string;
        response: string;
        confidence: "Confirmed" | "Likely" | "Unclear" | "Needs validation";
      }
    >
  >({});
  const [obsSavingGapId, setObsSavingGapId] = useState<string | null>(null);
  const [obsErrorById, setObsErrorById] = useState<Record<string, string>>({});
  const [whyExpandedById, setWhyExpandedById] = useState<Record<string, boolean>>({});

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

  async function createObservationForGap(gap: GapCardData) {
    const draft = obsDraftByGapId[gap.id] ?? {
      role: "",
      name: "",
      response: "",
      confidence: "Likely" as const,
    };

    const role = draft.role.trim();
    const name = draft.name.trim();
    const response = draft.response.trim();

    if (!role || !name || !response) {
      setObsErrorById((cur) => ({ ...cur, [gap.id]: "Complete role, name, and response before saving." }));
      return;
    }

    setObsSavingGapId(gap.id);
    setObsErrorById((cur) => ({ ...cur, [gap.id]: "" }));

    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role,
          name,
          response,
          confidence: draft.confidence,
          linkedSection: gap.section ?? null,
          visibility: null,
          timestampLabel: null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const created = (await res.json()) as { id?: string };
      const createdId = typeof created?.id === "string" ? created.id : null;
      if (!createdId) throw new Error("Created observation missing id.");

      // Auto-select the new observation for this gap's resolve dropdown.
      setResolveSelectionById((cur) => ({ ...cur, [gap.id]: createdId }));

      // Reset mini-form state and collapse it.
      setObsDraftByGapId((cur) => {
        const next = { ...cur };
        delete next[gap.id];
        return next;
      });
      setAddObsOpenById((cur) => ({ ...cur, [gap.id]: false }));

      // Refresh to ensure the new observation appears in the selector list.
      router.refresh();
    } catch (e) {
      setObsErrorById((cur) => ({
        ...cur,
        [gap.id]: e instanceof Error ? e.message : "Unknown error",
      }));
    } finally {
      setObsSavingGapId(null);
    }
  }

  return (
    <div className="space-y-2.5">
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
        const addObsOpen = addObsOpenById[g.id] ?? false;
        const obsDraft = obsDraftByGapId[g.id] ?? {
          role: "",
          name: "",
          response: "",
          confidence: "Likely" as const,
        };
        const obsMissingRequired = !obsDraft.role.trim() || !obsDraft.name.trim() || !obsDraft.response.trim();
        const why = (g.whyItMatters ?? "").trim();
        const hasWhy = (g.whyItMatters ?? "").trim().length > 0;
        const whyExpanded = whyExpandedById[g.id] ?? false;
        const whyLong = why.length > WHY_COLLAPSE_CHARS;
        const whyDisplay = !hasWhy
          ? ""
          : !whyLong || whyExpanded
            ? (g.whyItMatters ?? "").trim()
            : `${(g.whyItMatters ?? "").trim().slice(0, WHY_COLLAPSE_CHARS).trimEnd()}…`;

        return (
          <div key={g.id}>
            <CardShell
              expanded={expanded}
              onToggle={() => setOpenId((cur) => (cur === g.id ? null : g.id))}
              summary={
                <>
                  <p className="text-sm font-medium text-white/90">{preview}</p>
                  <div className="mt-1">
                    <MetaLine
                      parts={[
                        g.status ? `Status: ${g.status}` : null,
                        g.severity ? `Severity: ${g.severity}` : null,
                        g.section ? `Relates to: ${g.section}` : null,
                        g.stakeholder ? `Stakeholder: ${g.stakeholder}` : null,
                      ]}
                    />
                  </div>
                </>
              }
              details={
                <div className="space-y-2.5">
                  {/* Zone 1 — decision header: question + compact chips + tertiary utilities */}
                  <div className="relative overflow-hidden rounded-[1.05rem] border border-[color-mix(in_oklab,var(--metis-brass)_26%,rgba(255,255,255,0.12))] bg-[linear-gradient(135deg,rgba(164,132,82,0.14),rgba(255,255,255,0.03))] pl-4 pr-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[color-mix(in_oklab,var(--metis-brass)_70%,transparent)]" />
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={draftPromptById[g.id] ?? g.prompt}
                              onChange={(e) =>
                                setDraftPromptById((cur) => ({
                                  ...cur,
                                  [g.id]: e.target.value,
                                }))
                              }
                              className="min-h-[120px] w-full rounded-[0.95rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-3 py-3 text-sm leading-6 text-white/90 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
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
                          <p className="whitespace-pre-wrap text-[1.05rem] font-semibold leading-7 text-[--metis-paper]">
                            {g.prompt}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:max-w-[min(420px,46%)] lg:justify-end">
                        {g.status ? <Pill className={statusPillClass(g.status)}>{g.status}</Pill> : null}
                        {g.severity ? <Pill className={severityPillClass(g.severity)}>{g.severity}</Pill> : null}
                        {g.section ? <Pill className="border border-white/10 bg-black/20 text-white/75">Relates · {g.section}</Pill> : null}
                        {g.stakeholder ? <Pill className="border border-white/10 bg-black/20 text-white/70">Stake · {g.stakeholder}</Pill> : null}
                        {isEditing ? <Pill className="border border-white/10 bg-white/5 text-white/75">Editing</Pill> : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                      <ActionButton
                        className="border-white/8 bg-white/[0.02] text-white/65 hover:bg-white/[0.05]"
                        disabled={!canEdit || busyGapId === g.id}
                        onClick={() => beginEdit(g)}
                      >
                        <PencilLine size={14} />
                        Edit
                      </ActionButton>
                      <ActionButton
                        className="border-white/8 bg-white/[0.02] text-white/65 hover:bg-white/[0.05]"
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
                        Copy
                      </ActionButton>
                      {isResolved ? (
                        <ActionButton
                          className="border-white/8 bg-white/[0.02] text-white/65 hover:bg-white/[0.05]"
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
                      <TertiaryActionLink href={`/issues/${issueId}/gaps#${g.id}`}>
                        Advanced view
                      </TertiaryActionLink>
                    </div>
                  </div>

                  {/* Zone 2 — context (read-only) */}
                  {hasWhy ? (
                    <div className="rounded-[1.05rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.10))] px-3 py-2.5">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{whyDisplay}</p>
                      {whyLong ? (
                        <button
                          type="button"
                          onClick={() => setWhyExpandedById((cur) => ({ ...cur, [g.id]: !whyExpanded }))}
                          className="mt-2 text-xs font-medium text-[--metis-brass-soft] underline decoration-white/10 underline-offset-4 hover:decoration-white/25"
                        >
                          {whyExpanded ? "Show less" : "Show more"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Zone 3 — resolution (interactive) */}
                  <div className="rounded-[1.05rem] border border-white/8 bg-[linear-gradient(135deg,rgba(62,92,112,0.10),rgba(0,0,0,0.20))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {isResolved ? (
                      <p className="text-sm leading-6 text-emerald-100/80">
                        Resolved by: <span className="text-emerald-50/95">{resolvedByLabel ?? "—"}</span>
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        <p className="col-span-full text-[0.72rem] leading-snug text-white/55">
                          Answer, assign, or close on the{" "}
                          <Link href={`/issues/${issueId}/gaps`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
                            Open questions
                          </Link>{" "}
                          ledger when the thread is settled — use controls below from the workspace shortcut.
                        </p>
                        <div className="md:pr-3 md:border-r md:border-white/10">
                          <p className="text-xs text-white/55">Existing observation</p>
                          <p className="mt-1 text-sm text-white/70">Select, then mark answered.</p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <select
                              value={resolveSelectionById[g.id] ?? ""}
                              onChange={(e) =>
                                setResolveSelectionById((cur) => ({
                                  ...cur,
                                  [g.id]: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-white/85 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
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
                              Mark answered
                            </ActionButton>
                          </div>
                        </div>

                        <div className="md:pl-1">
                          <p className="text-xs text-white/55">New observation</p>
                          <p className="mt-1 text-sm text-white/70">Add an attributable observation that answers this question.</p>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-white/50">Save, then select it above and mark answered.</p>
                            <ActionButton
                              className="border-white/8 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                              onClick={() =>
                                setAddObsOpenById((cur) => ({
                                  ...cur,
                                  [g.id]: !addObsOpen,
                                }))
                              }
                              disabled={obsSavingGapId === g.id || busyGapId === g.id}
                            >
                              {addObsOpen ? (
                                <>
                                  <X size={14} />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  Add
                                </>
                              )}
                            </ActionButton>
                          </div>

                          {addObsOpen ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <label className="space-y-1">
                                  <span className="text-xs text-white/55">Role</span>
                                  <input
                                    value={obsDraft.role}
                                    onChange={(e) =>
                                      setObsDraftByGapId((cur) => ({
                                        ...cur,
                                        [g.id]: { ...obsDraft, role: e.target.value },
                                      }))
                                    }
                                    className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-white/85 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                    placeholder="e.g., On-call"
                                  />
                                </label>
                                <label className="space-y-1">
                                  <span className="text-xs text-white/55">Name</span>
                                  <input
                                    value={obsDraft.name}
                                    onChange={(e) =>
                                      setObsDraftByGapId((cur) => ({
                                        ...cur,
                                        [g.id]: { ...obsDraft, name: e.target.value },
                                      }))
                                    }
                                    className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-white/85 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                    placeholder="Attributable name"
                                  />
                                </label>
                              </div>

                              <label className="space-y-1">
                                <span className="text-xs text-white/55">Response</span>
                                <textarea
                                  value={obsDraft.response}
                                  onChange={(e) =>
                                    setObsDraftByGapId((cur) => ({
                                      ...cur,
                                      [g.id]: { ...obsDraft, response: e.target.value },
                                    }))
                                  }
                                  rows={4}
                                  className="w-full rounded-[0.95rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm leading-6 text-white/85 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                  placeholder="Attributable observation that answers the open question"
                                />
                              </label>

                              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                                <label className="space-y-1">
                                  <span className="text-xs text-white/55">Confidence</span>
                                  <select
                                    value={obsDraft.confidence}
                                    onChange={(e) =>
                                      setObsDraftByGapId((cur) => ({
                                        ...cur,
                                        [g.id]: {
                                          ...obsDraft,
                                          confidence: e.target.value as typeof obsDraft.confidence,
                                        },
                                      }))
                                    }
                                    className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-white/85 shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                                  >
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Likely">Likely</option>
                                    <option value="Unclear">Unclear</option>
                                    <option value="Needs validation">Needs validation</option>
                                  </select>
                                </label>
                                <div className="flex justify-end">
                                  <ActionButton
                                    tone="primary"
                                    disabled={obsSavingGapId === g.id || obsMissingRequired}
                                    onClick={() => void createObservationForGap(g)}
                                  >
                                    <Save size={14} />
                                    {obsSavingGapId === g.id ? "Saving…" : "Save observation"}
                                  </ActionButton>
                                </div>
                              </div>

                              {obsMissingRequired ? (
                                <p className="text-xs text-white/55">Complete role, name, and response to save.</p>
                              ) : null}
                              {obsErrorById[g.id] ? <p className="text-sm text-rose-200">{obsErrorById[g.id]}</p> : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                    {errorById[g.id] ? <p className="mt-2 text-sm text-rose-200">{errorById[g.id]}</p> : null}
                  </div>
                </div>
              }
            />
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

  if (sources.length === 0) {
    return (
      <p className="text-sm leading-6 text-white/55">
        No Sources in this workspace preview yet.{" "}
        <Link href={`/issues/${issueId}/sources`} className="font-medium text-[--metis-brass-soft] underline-offset-4 hover:underline">
          Open Sources
        </Link>{" "}
        to add or review evidence on the full ledger.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
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
              summary={
                <>
                  <p className="text-sm font-medium text-white/90">{title}</p>
                  <div className="mt-1">
                    <MetaLine
                      parts={[
                        s.tier ? `Tier: ${s.tier}` : null,
                        s.section ? `Section: ${s.section}` : null,
                        s.reliability ? `Reliability: ${s.reliability}` : null,
                        s.observedAt ? `Observed: ${formatIsoInstantLondon(s.observedAt)}` : null,
                      ]}
                    />
                  </div>
                  {notePreview ? (
                    <p className="mt-2 text-sm text-white/75">{notePreview}</p>
                  ) : (
                    <p className="mt-2 text-sm text-white/50">No note recorded.</p>
                  )}
                </>
              }
              details={
                <div className="space-y-3">
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
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export function WorkspaceObservationCards({ issueId, observations }: { issueId: string; observations: ObservationCardData[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [excludedById, setExcludedById] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const o of observations) init[o.id] = o.excludedFromBrief;
    return init;
  });

  async function toggleExcluded(id: string, next: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/issues/${issueId}/internal-inputs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ excludedFromBrief: next }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const json = (await res.json()) as { excludedFromBrief?: boolean };
      setExcludedById((cur) => ({ ...cur, [id]: Boolean(json.excludedFromBrief) }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2.5">
      {observations.map((o) => (
        <div
          key={o.id}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/90">{o.role} · {o.name}</p>
              <p className="mt-1 text-xs text-white/50">
                {[o.timestampLabel ?? "—", o.linkedSection ?? "—", o.visibility ?? "—"].join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {excludedById[o.id] ? (
                <span className="rounded-full border border-rose-200/15 bg-rose-900/25 px-2.5 py-0.5 text-[0.7rem] font-medium text-rose-50">
                  Excluded from brief
                </span>
              ) : null}
              <button
                type="button"
                disabled={busyId === o.id}
                onClick={() => void toggleExcluded(o.id, !excludedById[o.id])}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs",
                  busyId === o.id ? "cursor-not-allowed opacity-60" : "hover:bg-white/10",
                  excludedById[o.id] ? "border-white/10 bg-white/5 text-white/75" : "border-white/10 bg-white/5 text-white/75",
                )}
              >
                {excludedById[o.id] ? "Include in briefs" : "Exclude from briefs"}
              </button>
            </div>
          </div>
          <p className="mt-2.5 whitespace-pre-wrap text-sm text-white/85">{o.response}</p>
          <p className="mt-2 text-xs text-white/45">{formatIsoInstantLondon(o.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

