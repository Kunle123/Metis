"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claimStatusDisplayLabel } from "@/lib/claims/claimStatusUi";
import { ClaimStatusSchema, type ClaimStatus } from "@metis/shared/claim";

import { InputIntakeSuccess } from "./input-intake-success";

const CLAIM_STATUSES = ClaimStatusSchema.options;

export function InputClaimIntakeForm({ issueId, issueRoutePrefix }: { issueId: string; issueRoutePrefix: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<ClaimStatus>("NeedsValidation");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaved(false);
    if (!text.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: text.trim(),
          status,
          notes: notes.trim() ? notes.trim() : null,
          sourceIds: [],
          gapIds: [],
          internalInputIds: [],
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Could not create claim.");
      }
      setText("");
      setNotes("");
      setStatus("NeedsValidation");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create claim.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm leading-6 text-[--metis-paper-muted]">
        Add a statement to track on the claims register. Link sources and open questions on the Claims page when you are ready.
      </p>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Claim</span>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (saved) setSaved(false);
          }}
          rows={3}
          className="w-full rounded-[1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
          placeholder="What needs to be recorded or validated?"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClaimStatus)}
            className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
          >
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {claimStatusDisplayLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
            Notes <span className="font-normal text-[--metis-paper-muted]">(optional)</span>
          </span>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-10 rounded-full"
            placeholder="Context or validation notes"
          />
        </label>
      </div>
      {error ? (
        <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <InputIntakeSuccess
          message="Claim added to this issue."
          href={`${issueRoutePrefix}/claims`}
          linkLabel="View claims"
        />
      ) : null}
      <div className="flex justify-end border-t border-[--metis-outline-subtle] pt-4">
        <Button type="button" className="rounded-full px-5" disabled={isSaving || !text.trim()} onClick={onSubmit}>
          {isSaving ? "Saving…" : "Add claim"}
        </Button>
      </div>
    </div>
  );
}
