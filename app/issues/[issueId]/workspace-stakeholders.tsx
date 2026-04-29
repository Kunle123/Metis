"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StakeholderGroup = {
  id: string;
  name: string;
  description: string | null;
  defaultSensitivity: string | null;
  defaultChannels: string | null;
  defaultToneGuidance: string | null;
  displayOrder: number;
  isActive: boolean;
};

type IssueStakeholder = {
  id: string;
  stakeholderGroupId: string;
  priority: "High" | "Normal" | "Low";
  needsToKnow: string;
  issueRisk: string;
  channelGuidance: string;
  toneAdjustment: string | null;
  notes: string | null;
  group: StakeholderGroup;
};

const priorities = ["High", "Normal", "Low"] as const;

function cardTone(priority: IssueStakeholder["priority"]) {
  if (priority === "High") return "border-[rgba(227,176,73,0.35)] bg-[rgba(131,82,17,0.18)]";
  if (priority === "Low") return "border-white/8 bg-[rgba(0,0,0,0.14)]";
  return "border-white/10 bg-[rgba(255,255,255,0.03)]";
}

export function WorkspaceStakeholders({
  issueId,
  allGroups,
  selected,
}: {
  issueId: string;
  allGroups: StakeholderGroup[];
  selected: IssueStakeholder[];
}) {
  const router = useRouter();
  const [addGroupId, setAddGroupId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftById, setDraftById] = useState<Record<string, Partial<IssueStakeholder>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});

  const selectedGroupIds = useMemo(() => new Set(selected.map((s) => s.stakeholderGroupId)), [selected]);
  const selectedNeedGuidance = useMemo(
    () =>
      selected.filter(
        (s) =>
          !s.needsToKnow.trim() &&
          !s.issueRisk.trim() &&
          !s.channelGuidance.trim() &&
          !(s.toneAdjustment ?? "").trim() &&
          !(s.notes ?? "").trim(),
      ),
    [selected],
  );
  const availableGroups = useMemo(
    () => allGroups.filter((g) => g.isActive && !selectedGroupIds.has(g.id)),
    [allGroups, selectedGroupIds],
  );

  async function addSelection() {
    setAddError(null);
    const gid = addGroupId.trim();
    if (!gid) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stakeholderGroupId: gid }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      setAddGroupId("");
      router.refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  function beginEdit(row: IssueStakeholder) {
    setEditingId(row.id);
    setDraftById((cur) => ({
      ...cur,
      [row.id]: {
        priority: row.priority,
        needsToKnow: row.needsToKnow,
        issueRisk: row.issueRisk,
        channelGuidance: row.channelGuidance,
        toneAdjustment: row.toneAdjustment,
        notes: row.notes,
      },
    }));
    setRowErrorById((cur) => ({ ...cur, [row.id]: "" }));
  }

  async function saveRow(id: string) {
    const draft = draftById[id];
    if (!draft) return;
    setSavingId(id);
    setRowErrorById((cur) => ({ ...cur, [id]: "" }));
    try {
      const res = await fetch(`/api/issues/${issueId}/stakeholders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setRowErrorById((cur) => ({ ...cur, [id]: e instanceof Error ? e.message : "Unknown error" }));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    setDeletingId(id);
    setRowErrorById((cur) => ({ ...cur, [id]: "" }));
    try {
      const res = await fetch(`/api/issues/${issueId}/stakeholders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      router.refresh();
    } catch (e) {
      setRowErrorById((cur) => ({ ...cur, [id]: e instanceof Error ? e.message : "Unknown error" }));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-[--metis-paper-muted]">
            Use audience groups to plan messaging and outputs. This layer does not change the underlying sources, gaps, or observations.
          </p>
          {selectedNeedGuidance.length ? (
            <div className="mt-3 rounded-[1.1rem] border border-amber-400/25 bg-[rgba(131,82,17,0.16)] px-4 py-3 text-sm leading-6 text-amber-50/90">
              <p className="font-medium text-amber-50">Some audiences need guidance.</p>
              <p className="mt-1 text-amber-50/80">
                {selectedNeedGuidance.length === 1
                  ? `${selectedNeedGuidance[0]!.group.name} has no notes on record here yet; manage organisation audiences in Settings → Audience groups.`
                  : `${selectedNeedGuidance.length} audiences have no notes on record here yet; manage organisation audiences in Settings → Audience groups.`}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={addGroupId}
            onChange={(e) => setAddGroupId(e.target.value)}
            className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 sm:w-[320px]"
          >
            <option value="">{availableGroups.length ? "Select an audience group…" : "No available audience groups"}</option>
            {availableGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <Button
            className="h-10 rounded-full px-4"
            onClick={() => void addSelection()}
            disabled={adding || !addGroupId.trim() || availableGroups.length === 0}
          >
            {adding ? "Adding…" : "Add"}
          </Button>
        </div>
      </div>
      {addError ? <p className="text-sm text-rose-200">{addError}</p> : null}

      {selected.length ? (
        <div className="space-y-3">
          {selected.map((row) => {
            const expanded = openId === row.id;
            const isEditing = editingId === row.id;
            const draft = draftById[row.id];
            const err = rowErrorById[row.id];

            return (
              <div
                key={row.id}
                className={cn("rounded-[1.25rem] border px-5 py-4", cardTone(row.priority))}
              >
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === row.id ? null : row.id))}
                  className="flex w-full items-start justify-between gap-4 text-left"
                  aria-expanded={expanded}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[--metis-paper]">{row.group.name}</p>
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">{row.priority}</Badge>
                      {row.group.defaultSensitivity ? (
                        <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">
                          {row.group.defaultSensitivity}
                        </Badge>
                      ) : null}
                    </div>
                    {row.needsToKnow.trim() ? (
                      <p className="mt-2 text-sm text-[--metis-paper-muted] line-clamp-2">{row.needsToKnow}</p>
                    ) : (
                      <p className="mt-2 text-sm text-[--metis-paper-muted]">No issue-specific notes yet.</p>
                    )}
                  </div>
                  <div className="mt-0.5 flex shrink-0 items-center gap-2 text-white/40">
                    <span className="text-xs">{expanded ? "Hide" : "Details"}</span>
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {expanded ? (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Priority</span>
                        <select
                          value={(draft?.priority as any) ?? row.priority}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), priority: e.target.value as any },
                            }))
                          }
                          disabled={!isEditing}
                          className="h-10 rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60 disabled:opacity-60"
                        >
                          {priorities.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              className="h-10 rounded-full px-4"
                              onClick={() => void saveRow(row.id)}
                              disabled={savingId === row.id}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              {savingId === row.id ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              variant="outline"
                              className="h-10 rounded-full px-4"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            className="h-10 rounded-full px-4"
                            onClick={() => beginEdit(row)}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="h-10 rounded-full px-4"
                          onClick={() => void deleteRow(row.id)}
                          disabled={deletingId === row.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Needs to know</span>
                        <Textarea
                          value={(draft?.needsToKnow as any) ?? row.needsToKnow}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), needsToKnow: e.target.value },
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Issue risk</span>
                        <Textarea
                          value={(draft?.issueRisk as any) ?? row.issueRisk}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), issueRisk: e.target.value },
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Channel/output guidance</span>
                        <Textarea
                          value={(draft?.channelGuidance as any) ?? row.channelGuidance}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), channelGuidance: e.target.value },
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Tone adjustment (optional)</span>
                        <Textarea
                          value={(draft?.toneAdjustment as any) ?? row.toneAdjustment ?? ""}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), toneAdjustment: e.target.value },
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </label>
                      <label className="space-y-2 lg:col-span-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Notes (optional)</span>
                        <Textarea
                          value={(draft?.notes as any) ?? row.notes ?? ""}
                          onChange={(e) =>
                            setDraftById((cur) => ({
                              ...cur,
                              [row.id]: { ...(cur[row.id] ?? {}), notes: e.target.value },
                            }))
                          }
                          disabled={!isEditing}
                        />
                      </label>
                    </div>

                    {err ? <p className="text-sm text-rose-200">{err}</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[--metis-paper-muted]">No audience groups selected for this issue yet.</p>
      )}
    </div>
  );
}

