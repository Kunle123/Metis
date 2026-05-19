"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CollapsibleSection } from "@/components/review/CollapsibleSection";
import { Button } from "@/components/ui/button";

import { IssueLifecycleConfirmPanel, type IssueLifecycleConfirmMode } from "./IssueLifecycleConfirmPanel";

export function IssueLifecyclePanel({
  issueId,
  isArchived,
  canManageLifecycle,
  canDelete,
}: {
  issueId: string;
  isArchived: boolean;
  canManageLifecycle: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [confirmMode, setConfirmMode] = useState<IssueLifecycleConfirmMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManageLifecycle && !canDelete) return null;

  async function runConfirmed() {
    if (!confirmMode) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/issues/${issueId}/${confirmMode}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (typeof data?.error === "string") msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      setConfirmMode(null);
      if (confirmMode === "delete") {
        router.push("/");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <CollapsibleSection
        className="border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_32%,transparent)]"
        summary={
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[--metis-text-tertiary]">
                Manage issue
              </p>
              <p className="mt-1 text-sm text-[--metis-paper-muted]">Archive, reopen, or delete this issue record.</p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {error ? (
            <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
              {error}
            </p>
          ) : null}

          {canManageLifecycle ? (
            <div className="space-y-2">
              <p className="text-sm leading-6 text-[--metis-paper-muted]">
                {isArchived
                  ? "This issue is archived. Reopen it to return it to active lists and accept new updates."
                  : "Archive when the matter is complete or no longer active. The full record stays available."}
              </p>
              {isArchived ? (
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setConfirmMode("reopen")}>
                  Reopen issue
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setConfirmMode("archive")}>
                  Archive issue
                </Button>
              )}
            </div>
          ) : null}

          {canDelete ? (
            <div className="space-y-3 border-t border-[--metis-outline-subtle] pt-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[--metis-ink-soft]">Danger zone</p>
              <p className="text-sm leading-6 text-[--metis-paper-muted]">
                Delete only if this issue was created in error. This cannot be undone from the workspace.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                className="border-rose-400/30 text-rose-100 hover:bg-rose-900/30"
                onClick={() => setConfirmMode("delete")}
              >
                Delete issue
              </Button>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>

      <IssueLifecycleConfirmPanel
        mode={confirmMode ?? "archive"}
        open={confirmMode != null}
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirmMode(null);
        }}
        onConfirm={() => void runConfirmed()}
      />
    </>
  );
}
