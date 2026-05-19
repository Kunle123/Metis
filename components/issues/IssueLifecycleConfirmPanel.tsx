"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type IssueLifecycleConfirmMode = "archive" | "reopen" | "delete";

const COPY: Record<
  IssueLifecycleConfirmMode,
  { title: string; body: string; confirm: string; confirmRose?: boolean }
> = {
  archive: {
    title: "Archive this issue?",
    body: "It will be removed from active issue lists, but the record, briefs, messages, exports and activity history will remain available.",
    confirm: "Archive issue",
  },
  reopen: {
    title: "Reopen this issue?",
    body: "It will return to active issue lists and can receive new updates.",
    confirm: "Reopen issue",
  },
  delete: {
    title: "Delete this issue?",
    body: "Use this only if the issue was created in error. Deleted issues are removed from normal issue lists.",
    confirm: "Delete issue",
    confirmRose: true,
  },
};

export function IssueLifecycleConfirmPanel({
  mode,
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  mode: IssueLifecycleConfirmMode;
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const [deletePhrase, setDeletePhrase] = useState("");
  const copy = COPY[mode];
  const deleteReady = mode !== "delete" || deletePhrase.trim() === "DELETE";

  useEffect(() => {
    if (!open) setDeletePhrase("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-auto w-full max-w-md overflow-hidden rounded-[1.25rem] border border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-card)_96%,var(--metis-surface-page))] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <h2 id={titleId} className="font-[Cormorant_Garamond] text-2xl text-[--metis-paper]">
              {copy.title}
            </h2>
            <p className="text-sm leading-6 text-[--metis-paper-muted]">{copy.body}</p>
          </div>
          {mode === "delete" ? (
            <label className="block space-y-2">
              <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
                Type DELETE to confirm
              </span>
              <Input
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                autoComplete="off"
                className="border-[--metis-outline-subtle] bg-[var(--metis-control-bg)] text-[--metis-paper]"
                disabled={busy}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[--metis-outline-subtle] pt-4">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || !deleteReady}
              className={cn(
                copy.confirmRose &&
                  "border-rose-400/30 text-rose-100 hover:bg-rose-900/30 disabled:border-[--metis-control-disabled-border] disabled:text-[--metis-control-disabled-fg] disabled:hover:bg-transparent",
              )}
              onClick={onConfirm}
            >
              {busy ? "Working…" : copy.confirm}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
