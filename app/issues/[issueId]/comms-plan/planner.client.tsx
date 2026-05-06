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

  return (
    <div className="space-y-6">
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
                  <Button asChild variant="outline" disabled={isBusy}>
                    <Link href={href}>Prepare</Link>
                  </Button>
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

