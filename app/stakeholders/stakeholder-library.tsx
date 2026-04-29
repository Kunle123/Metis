"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Save, ToggleLeft, ToggleRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Group = {
  id: string;
  name: string;
  description: string | null;
  defaultSensitivity: string | null;
  defaultChannels: string | null;
  defaultToneGuidance: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const sensitivityOptions = ["Low", "Medium", "High"] as const;

export function StakeholderLibrary({ initialGroups }: { initialGroups: Group[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    defaultSensitivity: "" as "" | (typeof sensitivityOptions)[number],
    defaultChannels: "",
    defaultToneGuidance: "",
    displayOrder: "0",
  });

  const editable = useMemo(() => groups.find((g) => g.id === editId) ?? null, [editId, groups]);
  const [editDraft, setEditDraft] = useState<null | {
    name: string;
    description: string;
    defaultSensitivity: "" | (typeof sensitivityOptions)[number];
    defaultChannels: string;
    defaultToneGuidance: string;
    displayOrder: string;
    isActive: boolean;
  }>(null);

  function beginEdit(g: Group) {
    setEditId(g.id);
    setEditDraft({
      name: g.name,
      description: g.description ?? "",
      defaultSensitivity: (g.defaultSensitivity as any) ?? "",
      defaultChannels: g.defaultChannels ?? "",
      defaultToneGuidance: g.defaultToneGuidance ?? "",
      displayOrder: String(g.displayOrder ?? 0),
      isActive: g.isActive,
    });
    setErrorById((cur) => ({ ...cur, [g.id]: "" }));
  }

  async function createGroup() {
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/stakeholder-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: draft.name,
          description: draft.description.trim() ? draft.description : null,
          defaultSensitivity: draft.defaultSensitivity ? draft.defaultSensitivity : null,
          defaultChannels: draft.defaultChannels.trim() ? draft.defaultChannels : null,
          defaultToneGuidance: draft.defaultToneGuidance.trim() ? draft.defaultToneGuidance : null,
          displayOrder: Number.isFinite(Number(draft.displayOrder)) ? Number(draft.displayOrder) : 0,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const created = (await res.json()) as Group;
      setGroups((cur) => [created, ...cur]);
      setDraft({
        name: "",
        description: "",
        defaultSensitivity: "",
        defaultChannels: "",
        defaultToneGuidance: "",
        displayOrder: "0",
      });
      router.refresh();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editDraft) return;
    setSavingId(id);
    setErrorById((cur) => ({ ...cur, [id]: "" }));
    try {
      const res = await fetch(`/api/stakeholder-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editDraft.name,
          description: editDraft.description.trim() ? editDraft.description : null,
          defaultSensitivity: editDraft.defaultSensitivity ? editDraft.defaultSensitivity : null,
          defaultChannels: editDraft.defaultChannels.trim() ? editDraft.defaultChannels : null,
          defaultToneGuidance: editDraft.defaultToneGuidance.trim() ? editDraft.defaultToneGuidance : null,
          displayOrder: Number.isFinite(Number(editDraft.displayOrder)) ? Number(editDraft.displayOrder) : 0,
          isActive: editDraft.isActive,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const updated = (await res.json()) as Group;
      setGroups((cur) => cur.map((g) => (g.id === id ? updated : g)));
      setEditId(null);
      setEditDraft(null);
      router.refresh();
    } catch (e) {
      setErrorById((cur) => ({ ...cur, [id]: e instanceof Error ? e.message : "Unknown error" }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.25rem] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[--metis-ink-soft]">Add audience group</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Reusable organisation-level audiences used by Messages.</p>
          </div>
          <Button
            onClick={() => void createGroup()}
            disabled={creating || !draft.name.trim()}
            className="rounded-full"
          >
            {creating ? "Saving…" : "Add group"}
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Name</span>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Sensitivity (optional)</span>
            <select
              value={draft.defaultSensitivity}
              onChange={(e) => setDraft((d) => ({ ...d, defaultSensitivity: e.target.value as any }))}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              <option value="">—</option>
              {sensitivityOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Default channels (optional)</span>
            <Input
              value={draft.defaultChannels}
              onChange={(e) => setDraft((d) => ({ ...d, defaultChannels: e.target.value }))}
              placeholder="e.g., Email, intranet, press line"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Display order</span>
            <Input
              value={draft.displayOrder}
              onChange={(e) => setDraft((d) => ({ ...d, displayOrder: e.target.value }))}
              placeholder="0"
            />
          </label>
        </div>
        <label className="mt-3 block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Description (optional)</span>
          <Textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="What this group typically cares about."
          />
        </label>
        <label className="mt-3 block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Tone guidance (optional)</span>
          <Textarea
            value={draft.defaultToneGuidance}
            onChange={(e) => setDraft((d) => ({ ...d, defaultToneGuidance: e.target.value }))}
            placeholder="Default tone adjustments, if any."
          />
        </label>
        {createError ? <p className="mt-3 text-sm text-rose-200">{createError}</p> : null}
      </div>

      <div className="space-y-3">
        {groups.map((g) => {
          const isEditing = editId === g.id;
          const err = errorById[g.id];
          const rowTone = g.isActive ? "bg-[rgba(255,255,255,0.03)]" : "bg-[rgba(0,0,0,0.18)]";

          return (
            <div key={g.id} className={cn("rounded-[1.25rem] border border-white/10 px-5 py-5", rowTone)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[--metis-paper]">{g.name}</p>
                    {g.isActive ? (
                      <Badge className="border-0 bg-white/8 text-[--metis-paper-muted]">Active</Badge>
                    ) : (
                      <Badge className="border-0 bg-white/6 text-[--metis-paper-muted]">Inactive</Badge>
                    )}
                    {g.defaultSensitivity ? (
                      <Badge className="border-0 bg-[--metis-brass]/12 text-[--metis-brass-soft]">
                        {g.defaultSensitivity}
                      </Badge>
                    ) : null}
                  </div>
                  {g.description ? <p className="mt-2 text-sm text-[--metis-paper-muted]">{g.description}</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      if (isEditing) {
                        setEditId(null);
                        setEditDraft(null);
                      } else {
                        beginEdit(g);
                      }
                    }}
                  >
                    {isEditing ? <X className="mr-2 h-4 w-4" /> : <PencilLine className="mr-2 h-4 w-4" />}
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </div>

              {isEditing && editDraft ? (
                <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Name</span>
                      <Input value={editDraft.name} onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Sensitivity</span>
                      <select
                        value={editDraft.defaultSensitivity}
                        onChange={(e) =>
                          setEditDraft((d) =>
                            d ? { ...d, defaultSensitivity: e.target.value as any } : d,
                          )
                        }
                        className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
                      >
                        <option value="">—</option>
                        {sensitivityOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Default channels</span>
                      <Input
                        value={editDraft.defaultChannels}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, defaultChannels: e.target.value } : d))}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Display order</span>
                      <Input
                        value={editDraft.displayOrder}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, displayOrder: e.target.value } : d))}
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Description</span>
                    <Textarea
                      value={editDraft.description}
                      onChange={(e) => setEditDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Tone guidance</span>
                    <Textarea
                      value={editDraft.defaultToneGuidance}
                      onChange={(e) => setEditDraft((d) => (d ? { ...d, defaultToneGuidance: e.target.value } : d))}
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditDraft((d) => (d ? { ...d, isActive: !d.isActive } : d))
                      }
                      className="inline-flex items-center gap-2 text-sm text-[--metis-paper-muted] hover:text-[--metis-paper]"
                    >
                      {editDraft.isActive ? <ToggleRight className="h-5 w-5 text-[--metis-brass-soft]" /> : <ToggleLeft className="h-5 w-5 text-white/50" />}
                      {editDraft.isActive ? "Active" : "Inactive"}
                    </button>

                    <Button
                      onClick={() => void saveEdit(g.id)}
                      disabled={savingId === g.id || !editDraft.name.trim()}
                      className="rounded-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {savingId === g.id ? "Saving…" : "Save changes"}
                    </Button>
                  </div>

                  {err ? <p className="text-sm text-rose-200">{err}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

