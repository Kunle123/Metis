"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CommsPlanOutputTypeSchema,
  CommsPlanScheduleTypeSchema,
  CommsPlanStatusSchema,
  CommsPlanTriggerTypeSchema,
  type CommsPlanItem,
  type CommsPlanOutputType,
  type CommsPlanScheduleType,
  type CommsPlanStatus,
  type CommsPlanTriggerType,
} from "@metis/shared/commsPlan";
import { MessageVariantTemplateIdSchema, type MessageVariantTemplateId } from "@metis/shared/messageVariant";
import { BriefModeSchema, type BriefMode } from "@metis/shared/briefVersion";
import { ExportFormatSchema, type ExportFormat } from "@metis/shared/export";
import type { CreateCommsPlanItemInput } from "@metis/shared/commsPlan";
import {
  generateCommsPlanSuggestions,
  commsPlanTemplateFingerprint,
  type CommsPlanEventType,
  type PlanSuggestion,
} from "@/lib/comms/generateCommsPlanTemplate";

type AudienceGroup = { id: string; name: string };

type Props = {
  issueId: string;
  initialItems: CommsPlanItem[];
  audienceGroups: AudienceGroup[];
  defaultOwner: string | null;
};

function formatLondon(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" }).format(d);
}

function isoFromDatetimeLocal(value: string) {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fingerprintFromPlanItem(item: CommsPlanItem): string {
  const payload: CreateCommsPlanItemInput = {
    stakeholderGroupId: item.stakeholderGroupId ?? null,
    title: item.title,
    outputType: item.outputType,
    messageTemplateId: item.messageTemplateId ?? undefined,
    briefMode: item.briefMode ?? undefined,
    exportFormat: item.exportFormat ?? undefined,
    channel: item.channel,
    scheduleType: item.scheduleType,
    cadenceMinutes: item.cadenceMinutes ?? undefined,
    triggerType: item.triggerType ?? undefined,
    nextDueAt: item.nextDueAt ?? undefined,
    owner: item.owner ?? undefined,
    notes: item.notes ?? undefined,
  };
  return commsPlanTemplateFingerprint(payload);
}

function formatSuggestionListCount(n: number) {
  if (n === 0) return "No suggestions";
  if (n === 1) return "1 suggestion";
  return `${n} suggestions`;
}

function buildSuggestionFeedbackLines(opts: {
  duplicateShapesHiddenInSuggestionBatch: number;
  hiddenAsAlreadyInPlan: number;
  validationFailed: number;
}): string[] {
  const lines: string[] = [];
  if (opts.duplicateShapesHiddenInSuggestionBatch > 0) {
    const n = opts.duplicateShapesHiddenInSuggestionBatch;
    lines.push(
      `${n} duplicate suggestion row${n === 1 ? "" : "s"} hidden in this set — another row with the same template shape was kept.`,
    );
  }
  if (opts.hiddenAsAlreadyInPlan > 0) {
    const n = opts.hiddenAsAlreadyInPlan;
    lines.push(`${n} duplicate suggestion${n === 1 ? "" : "s"} hidden because similar items are already in the active plan.`);
  }
  if (opts.validationFailed > 0) {
    const n = opts.validationFailed;
    lines.push(
      n === 1
        ? "1 template suggestion could not be used because it did not pass validation."
        : `${n} template suggestions could not be used because they did not pass validation.`,
    );
  }
  return lines;
}

function prepareHref(issueId: string, item: CommsPlanItem) {
  if (item.outputType === "message") {
    const template = item.messageTemplateId ?? "external_customer_resident_student";
    const lens = item.stakeholderGroupId ?? "issue";
    return `/issues/${issueId}/messages?template=${encodeURIComponent(template)}&lens=${encodeURIComponent(lens)}`;
  }
  if (item.outputType === "brief") {
    const mode = item.briefMode ?? "full";
    return `/issues/${issueId}/brief?mode=${encodeURIComponent(mode)}`;
  }
  if (item.outputType === "export") {
    const mode = item.briefMode ?? "full";
    const format = item.exportFormat ?? "full-issue-brief";
    return `/issues/${issueId}/export?mode=${encodeURIComponent(mode)}&format=${encodeURIComponent(format)}`;
  }
  return `/issues/${issueId}`;
}

function dueState(item: CommsPlanItem, now: number) {
  if (item.status === "sent" || item.status === "skipped") return { kind: "done" as const, label: item.status };
  if (item.scheduleType === "trigger" && !item.nextDueAt) return { kind: "trigger" as const, label: "Trigger" };
  if (!item.nextDueAt) return { kind: "none" as const, label: "No due time" };
  const t = new Date(item.nextDueAt).getTime();
  if (Number.isNaN(t)) return { kind: "none" as const, label: "No due time" };
  if (t < now) return { kind: "overdue" as const, label: `Overdue · ${formatLondon(item.nextDueAt)}` };
  return { kind: "due" as const, label: `Due · ${formatLondon(item.nextDueAt)}` };
}

const DUE_BADGE: Record<string, string> = {
  overdue: "border-0 bg-[rgba(132,26,42,0.62)] text-rose-50",
  due: "border-0 bg-[rgba(19,86,118,0.55)] text-sky-50",
  trigger: "border-0 bg-white/8 text-[--metis-paper-muted]",
  none: "border-0 bg-white/6 text-[--metis-paper-muted]",
  done: "border-0 bg-[rgba(18,84,58,0.62)] text-emerald-50",
};

export function CommsPlanClient({ issueId, initialItems, audienceGroups, defaultOwner }: Props) {
  const [items, setItems] = useState<CommsPlanItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [skipOpenId, setSkipOpenId] = useState<string | null>(null);
  const [skipDraftById, setSkipDraftById] = useState<Record<string, string>>({});
  const [suggestEventType, setSuggestEventType] = useState<CommsPlanEventType>("operational_incident");
  const [suggestSelectedAudienceIds, setSuggestSelectedAudienceIds] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<PlanSuggestion[]>([]);
  const [suggestNoticeLines, setSuggestNoticeLines] = useState<string[]>([]);
  const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    title: "",
    stakeholderGroupId: "" as "" | string,
    outputType: "message" as CommsPlanOutputType,
    messageTemplateId: "external_customer_resident_student" as MessageVariantTemplateId,
    briefMode: "full" as BriefMode,
    exportFormat: "full-issue-brief" as ExportFormat,
    channel: "Email",
    scheduleType: "one_off" as CommsPlanScheduleType,
    cadenceMinutes: "" as string,
    triggerType: "manual" as CommsPlanTriggerType,
    nextDueAtLocal: "" as string,
    owner: defaultOwner ?? "",
    notes: "",
  });

  const now = Date.now();

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const at = a.nextDueAt ? new Date(a.nextDueAt).getTime() : Infinity;
      const bt = b.nextDueAt ? new Date(b.nextDueAt).getTime() : Infinity;
      if (at !== bt) return at - bt;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return copy;
  }, [items]);

  async function refresh() {
    const res = await fetch(`/api/issues/${issueId}/comms-plan`, { credentials: "include" });
    if (!res.ok) throw new Error(await res.text());
    const json = (await res.json()) as { items: CommsPlanItem[] };
    setItems(json.items);
  }

  async function createItem() {
    setError(null);
    setCreating(true);
    try {
      const payload: any = {
        stakeholderGroupId: createDraft.stakeholderGroupId ? createDraft.stakeholderGroupId : null,
        title: createDraft.title,
        outputType: createDraft.outputType,
        channel: createDraft.channel,
        scheduleType: createDraft.scheduleType,
        owner: createDraft.owner.trim() ? createDraft.owner : null,
        notes: createDraft.notes.trim() ? createDraft.notes : null,
        nextDueAt: isoFromDatetimeLocal(createDraft.nextDueAtLocal),
      };
      if (createDraft.outputType === "message") payload.messageTemplateId = createDraft.messageTemplateId;
      if (createDraft.outputType === "brief") payload.briefMode = createDraft.briefMode;
      if (createDraft.outputType === "export") {
        payload.briefMode = createDraft.briefMode;
        payload.exportFormat = createDraft.exportFormat;
      }
      if (createDraft.scheduleType === "cadence") payload.cadenceMinutes = Number(createDraft.cadenceMinutes || 0) || null;
      if (createDraft.scheduleType === "trigger") payload.triggerType = createDraft.triggerType;

      const res = await fetch(`/api/issues/${issueId}/comms-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
      setCreateDraft((d) => ({ ...d, title: "", notes: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function createItemFromSuggestion(input: CreateCommsPlanItemInput) {
    const res = await fetch(`/api/issues/${issueId}/comms-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function patchItem(id: string, patch: any) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/issues/${issueId}/comms-plan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmSkip(id: string) {
    const reason = (skipDraftById[id] ?? "").trim();
    if (!reason) return;
    await patchItem(id, { status: "skipped" as CommsPlanStatus, skipReason: reason });
    setSkipOpenId(null);
  }

  async function deleteItem(id: string) {
    setError(null);
    if (!confirm("Delete this comms plan item?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/issues/${issueId}/comms-plan/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  function generateSuggestedPlan() {
    setSuggestNoticeLines([]);
    const selectedAudienceGroupIds = Object.entries(suggestSelectedAudienceIds)
      .filter(([, on]) => on)
      .map(([id]) => id);

    const out = generateCommsPlanSuggestions({
      eventType: suggestEventType,
      selectedAudienceGroupIds,
      audienceGroups,
      defaultOwner,
    });

    const existingFp = new Set(items.map((i) => fingerprintFromPlanItem(i)));
    let hiddenAsAlreadyInPlan = 0;
    const filtered: typeof out.suggestions = [];
    for (const s of out.suggestions) {
      const fp = commsPlanTemplateFingerprint(s.item);
      if (existingFp.has(fp)) {
        hiddenAsAlreadyInPlan++;
        continue;
      }
      filtered.push(s);
    }

    setSuggestions(filtered);
    setSuggestNoticeLines(
      buildSuggestionFeedbackLines({
        duplicateShapesHiddenInSuggestionBatch: out.duplicateShapesHiddenInSuggestionBatch,
        hiddenAsAlreadyInPlan,
        validationFailed: out.validationRejected.length,
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Suggested plan</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">
              Generate a suggested set of communications based on event type and selected audiences. Nothing becomes active until you add it.
            </p>
          </div>
          <Button variant="outline" onClick={generateSuggestedPlan}>
            Generate suggested plan
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Event type</span>
            <select
              className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
              value={suggestEventType}
              onChange={(e) => setSuggestEventType(e.target.value as CommsPlanEventType)}
            >
              <option value="operational_incident">Operational incident</option>
              <option value="reputational_crisis">Reputational crisis</option>
              <option value="regulatory_legal">Regulatory/legal</option>
              <option value="proactive_comms">Proactive comms</option>
              <option value="media_inquiry">Media inquiry</option>
              <option value="internal_change">Internal change</option>
              <option value="leadership_only">Leadership only</option>
            </select>
          </label>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Audiences to include</span>
            <div className="rounded-[1rem] border border-white/10 bg-black/10 px-3 py-2">
              <div className="grid gap-1.5">
                {audienceGroups.map((g) => {
                  const on = Boolean(suggestSelectedAudienceIds[g.id]);
                  return (
                    <label key={g.id} className="flex items-center gap-2 text-sm text-[--metis-paper-muted]">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) =>
                          setSuggestSelectedAudienceIds((cur) => ({
                            ...cur,
                            [g.id]: e.target.checked,
                          }))
                        }
                      />
                      <span className="text-[--metis-paper]">{g.name}</span>
                    </label>
                  );
                })}
                {audienceGroups.length === 0 ? (
                  <p className="text-sm text-[--metis-paper-muted]">No audience groups found.</p>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-[--metis-paper-muted]">
                Leave blank to generate general rows (no audience group) where sensible.
              </p>
            </div>
          </div>
        </div>

        {suggestNoticeLines.length ? (
          <div className="mt-3 space-y-1.5">
            {suggestNoticeLines.map((line, idx) => (
              <p
                key={idx}
                className={cn(
                  "text-sm leading-relaxed",
                  line.includes("pass validation") ? "text-amber-100/90" : "text-[--metis-paper-muted]",
                )}
              >
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {suggestions.length ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[--metis-paper-muted]">
                {formatSuggestionListCount(suggestions.length)}
                {" — "}review below before adding to the active plan.
              </p>
              <Button
                onClick={() => {
                  void (async () => {
                    setError(null);
                    setAddingAll(true);
                    try {
                      const results = await Promise.allSettled(
                        suggestions.map(async (s) => {
                          await createItemFromSuggestion(s.item);
                          return s.id;
                        }),
                      );
                      const failed = results.filter((r) => r.status === "rejected");
                      if (failed.length) {
                        setError(`Some suggested rows failed to add (${failed.length}). Add individually to see specific errors.`);
                      } else {
                        setSuggestions([]);
                      }
                      await refresh();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Unknown error");
                    } finally {
                      setAddingAll(false);
                    }
                  })();
                }}
                disabled={addingAll}
              >
                {addingAll ? "Adding…" : "Add all to active plan"}
              </Button>
            </div>

            {suggestions.map((s) => (
              <div key={s.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[--metis-paper]">{s.item.title}</p>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Suggested</Badge>
                      {s.item.stakeholderGroupId ? (
                        <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">Audience group</Badge>
                      ) : (
                        <Badge className="border-0 bg-white/6 text-[--metis-paper-muted]">General</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[--metis-paper-muted]">{s.why}</p>
                    <p className="text-xs text-[--metis-paper-muted]">
                      <span className="text-[--metis-paper]">Output</span> · {s.item.outputType}
                      <span className="mx-2 text-white/20" aria-hidden>
                        •
                      </span>
                      <span className="text-[--metis-paper]">Channel</span> · {s.item.channel}
                      <span className="mx-2 text-white/20" aria-hidden>
                        •
                      </span>
                      <span className="text-[--metis-paper]">Schedule</span> · {s.item.scheduleType}
                      {s.item.scheduleType === "cadence" && s.item.cadenceMinutes ? ` (${s.item.cadenceMinutes}m)` : ""}
                      {s.item.scheduleType === "trigger" && s.item.triggerType ? ` (${s.item.triggerType})` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      disabled={addingAll || addingSuggestionId === s.id}
                      onClick={() => {
                        void (async () => {
                          setError(null);
                          setAddingSuggestionId(s.id);
                          try {
                            await createItemFromSuggestion(s.item);
                            await refresh();
                            setSuggestions((cur) => cur.filter((x) => x.id !== s.id));
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Unknown error");
                          } finally {
                            setAddingSuggestionId(null);
                          }
                        })();
                      }}
                    >
                      {addingSuggestionId === s.id ? "Adding…" : "Add to active plan"}
                    </Button>
                    <Button variant="ghost" disabled={addingAll} onClick={() => setSuggestions((cur) => cur.filter((x) => x.id !== s.id))}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[--metis-paper-muted]">No suggested rows yet. Choose inputs above and generate.</p>
        )}
      </div>

      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Add planned communication</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Track preparation vs sending. Add a due time only when it’s meaningful.</p>
          </div>
          <Button onClick={() => void createItem()} disabled={creating || !createDraft.title.trim()}>
            {creating ? "Saving…" : "Add item"}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Title</span>
            <Input value={createDraft.title} onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g., Board note 17:00" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Audience group (optional)</span>
            <select
              className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
              value={createDraft.stakeholderGroupId}
              onChange={(e) => setCreateDraft((d) => ({ ...d, stakeholderGroupId: e.target.value }))}
            >
              <option value="">—</option>
              {audienceGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Output type</span>
            <select
              className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
              value={createDraft.outputType}
              onChange={(e) =>
                setCreateDraft((d) => ({
                  ...d,
                  outputType: CommsPlanOutputTypeSchema.parse(e.target.value),
                }))
              }
            >
              <option value="message">Message</option>
              <option value="brief">Brief</option>
              <option value="export">Export</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Channel</span>
            <Input value={createDraft.channel} onChange={(e) => setCreateDraft((d) => ({ ...d, channel: e.target.value }))} placeholder="e.g., Email / Intranet / Press line" />
          </label>
        </div>

        {createDraft.outputType === "message" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Message template</span>
              <select
                className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                value={createDraft.messageTemplateId}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    messageTemplateId: MessageVariantTemplateIdSchema.parse(e.target.value),
                  }))
                }
              >
                <option value="external_customer_resident_student">External update</option>
                <option value="internal_staff_update">Internal staff update</option>
                <option value="media_holding_line">Media holding line</option>
              </select>
            </label>
          </div>
        ) : null}

        {createDraft.outputType === "brief" || createDraft.outputType === "export" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Brief mode</span>
              <select
                className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                value={createDraft.briefMode}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    briefMode: BriefModeSchema.parse(e.target.value),
                  }))
                }
              >
                <option value="full">Full</option>
                <option value="executive">Executive</option>
              </select>
            </label>
            {createDraft.outputType === "export" ? (
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Export format</span>
                <select
                  className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                  value={createDraft.exportFormat}
                  onChange={(e) =>
                    setCreateDraft((d) => ({
                      ...d,
                      exportFormat: ExportFormatSchema.parse(e.target.value),
                    }))
                  }
                >
                  <option value="full-issue-brief">Full issue brief</option>
                  <option value="executive-brief">Executive brief</option>
                  <option value="board-note">Board note</option>
                  <option value="email-ready">Email-ready</option>
                </select>
              </label>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Schedule</span>
            <select
              className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
              value={createDraft.scheduleType}
              onChange={(e) =>
                setCreateDraft((d) => ({
                  ...d,
                  scheduleType: CommsPlanScheduleTypeSchema.parse(e.target.value),
                }))
              }
            >
              <option value="one_off">One-off</option>
              <option value="cadence">Cadence</option>
              <option value="trigger">Trigger</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Due time (optional)</span>
            <Input
              type="datetime-local"
              value={createDraft.nextDueAtLocal}
              onChange={(e) => setCreateDraft((d) => ({ ...d, nextDueAtLocal: e.target.value }))}
            />
          </label>
        </div>

        {createDraft.scheduleType === "cadence" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Cadence minutes</span>
              <Input
                inputMode="numeric"
                value={createDraft.cadenceMinutes}
                onChange={(e) => setCreateDraft((d) => ({ ...d, cadenceMinutes: e.target.value }))}
                placeholder="e.g., 120"
              />
            </label>
          </div>
        ) : null}

        {createDraft.scheduleType === "trigger" ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Trigger</span>
              <select
                className="h-11 w-full rounded-md border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                value={createDraft.triggerType}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    triggerType: CommsPlanTriggerTypeSchema.parse(e.target.value),
                  }))
                }
              >
                <option value="manual">Manual</option>
                <option value="on_approval">After approval</option>
                <option value="on_confirmed_impact">After impact confirmed</option>
                <option value="on_press_inquiry">If press inquiry arrives</option>
                <option value="on_status_change">On issue status change</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Owner (optional)</span>
            <Input value={createDraft.owner} onChange={(e) => setCreateDraft((d) => ({ ...d, owner: e.target.value }))} />
          </label>
        </div>

        <label className="mt-3 block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Notes (optional)</span>
          <Textarea value={createDraft.notes} onChange={(e) => setCreateDraft((d) => ({ ...d, notes: e.target.value }))} />
        </label>

        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5 text-sm text-[--metis-paper-muted]">
            No planned communications yet.
          </div>
        ) : null}

        {sorted.map((item) => {
          const due = dueState(item, now);
          const href = prepareHref(issueId, item);
          const isBusy = busyId === item.id;
          const skipOpen = skipOpenId === item.id;
          const skipDraft = skipDraftById[item.id] ?? "";
          const canEditStatus = item.status !== "sent" && item.status !== "skipped";
          const owner = item.owner?.trim() || "—";
          const audience = item.stakeholderGroupName ?? (item.stakeholderGroupId ? "Audience group" : "General (no audience group)");

          return (
            <div key={item.id} className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[--metis-paper]">{item.title}</p>
                    <Badge className={DUE_BADGE[due.kind]}>{due.label}</Badge>
                    <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[--metis-paper-muted]">
                    <span className="text-[--metis-paper]">Audience</span> · {audience}
                    <span className="mx-2 text-white/20" aria-hidden>
                      •
                    </span>
                    <span className="text-[--metis-paper]">Channel</span> · {item.channel}
                    <span className="mx-2 text-white/20" aria-hidden>
                      •
                    </span>
                    <span className="text-[--metis-paper]">Owner</span> · {owner}
                  </p>
                  {item.notes?.trim() ? <p className="mt-2 text-sm leading-6 text-[--metis-paper-muted]">{item.notes}</p> : null}
                  {item.status === "skipped" && item.skipReason?.trim() ? (
                    <p className="mt-2 text-sm text-[--metis-paper-muted]">
                      <span className="text-[--metis-paper]">Skipped</span> · {item.skipReason}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isBusy ? (
                    <Button type="button" variant="outline" disabled>
                      Prepare
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href={href} prefetch={false}>
                        Prepare
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    disabled={isBusy || !canEditStatus}
                    onClick={() => void patchItem(item.id, { status: "prepared" as CommsPlanStatus })}
                  >
                    Mark prepared
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isBusy || !canEditStatus}
                    onClick={() => void patchItem(item.id, { status: "sent" as CommsPlanStatus })}
                  >
                    Mark sent
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isBusy || !canEditStatus}
                    onClick={() => {
                      setSkipOpenId((cur) => (cur === item.id ? null : item.id));
                      setSkipDraftById((cur) => ({ ...cur, [item.id]: cur[item.id] ?? item.skipReason ?? "" }));
                    }}
                  >
                    Skip
                  </Button>
                  <Button variant="outline" disabled={isBusy} onClick={() => void deleteItem(item.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              {skipOpen ? (
                <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <label className="block space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Skip reason</span>
                        <Textarea
                          value={skipDraft}
                          onChange={(e) => setSkipDraftById((cur) => ({ ...cur, [item.id]: e.target.value }))}
                          placeholder="Explain why this communication is being skipped."
                        />
                      </label>
                      <p className="mt-2 text-xs text-[--metis-paper-muted]">Explain why this communication is being skipped.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button disabled={isBusy || skipDraft.trim().length === 0} onClick={() => void confirmSkip(item.id)}>
                        Confirm skip
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => {
                          setSkipOpenId(null);
                          setSkipDraftById((cur) => {
                            const next = { ...cur };
                            delete next[item.id];
                            return next;
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

