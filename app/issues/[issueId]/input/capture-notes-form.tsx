"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { CaptureNotesExtractPanel } from "./capture-notes-extract-panel";
import { InputIntakeSuccess } from "./input-intake-success";

type MeUser = { id: string; email: string; role: string };

/** Prefer a readable label from login email before @ ; otherwise fallback for `name`. */
function attributionNameFromEmail(email: string | null | undefined): string {
  const e = email?.trim();
  if (!e) return "Captured notes";
  const at = e.indexOf("@");
  const base = at > 0 ? e.slice(0, at).trim() : e;
  if (!base.length) return "Captured notes";
  return base.includes(".") ? base.replace(/\./g, " ") : base;
}

export function CaptureNotesForm({
  issueId,
  issueRoutePrefix,
  captureNotesAiEnabled = false,
  embedded = false,
}: {
  issueId: string;
  issueRoutePrefix?: string;
  /** From server env `NOTES_CAPTURE_AI_ENABLED`; never expose secrets. */
  captureNotesAiEnabled?: boolean;
  /** When true, omits outer marketing header (used inside Add to record workbench). */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [meetingLabel, setMeetingLabel] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const u = data?.user as MeUser | undefined;
        if (u?.email) setUserEmail(String(u.email));
      } catch {
        // stay on default name
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedNotes = notes.trim();
  const canSubmit = trimmedNotes.length > 0 && !isSaving;

  async function onSave() {
    setError(null);
    setSuccess(false);
    if (!trimmedNotes.length) return;
    setIsSaving(true);
    try {
      const labelTrimmed = meetingLabel.trim();
      const res = await fetch(`/api/issues/${issueId}/internal-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "Notes capture",
          name: attributionNameFromEmail(userEmail),
          response: trimmedNotes,
          confidence: "Needs validation",
          excludedFromBrief: true,
          visibility: "Organisation",
          linkedSection: null,
          timestampLabel: labelTrimmed.length ? labelTrimmed : null,
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      setNotes("");
      setMeetingLabel("");
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save and structure.");
    } finally {
      setIsSaving(false);
    }
  }

  function onNotesChange(v: string) {
    setNotes(v);
    if (success) setSuccess(false);
    if (error) setError(null);
  }

  const shellClass = embedded
    ? undefined
    : "scroll-mt-28 overflow-hidden rounded-[1.25rem] border border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-info-bg)_72%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)]";

  return (
    <div id={embedded ? undefined : "capture-notes"} className={shellClass}>
      {embedded ? (
        <div className="border-b border-[--metis-outline-subtle] px-4 py-3 sm:px-5">
          <p className="text-sm leading-6 text-[--metis-paper-muted]">
            Paste an email, note, update, call summary, or instruction. Metis will add it to this issue record and help you structure it
            into sources, claims, and open questions.
          </p>
          <p className="mt-2 text-xs leading-5 text-[--metis-paper-muted]">
            Submitting saves the material on the record for triage — not just a private note.
            {captureNotesAiEnabled
              ? " Optional AI suggestions can appear below before or after you save; registers update only when you accept them."
              : " Promote points into the registers when you are ready."}
          </p>
        </div>
      ) : (
        <div className="border-b border-[--metis-outline-subtle] px-4 py-4 sm:px-5 sm:py-5">
          <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Update record</p>
          <p className="text-sm leading-6 text-[--metis-paper-muted]">
            Add new material to this issue. Paste an email, note, update, call summary or instruction, or add a structured source, claim,
            open question or internal note — you do not need to decide the register first.
          </p>
        </div>

        <p className="mt-3 text-xs leading-5 text-[--metis-paper-muted]">
          Submitting adds the material to this issue record for triage and structuring — not just a private note. You can promote points
          into sources, claims, and open questions as you review.
          {captureNotesAiEnabled ? (
            <>
              {" "}
              Optional AI suggestions appear below for review; nothing is added to the registers until you accept them or save and
              structure.
            </>
          ) : null}
        </p>
        </div>
      )}

      <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
            Meeting label <span className="font-normal text-[--metis-paper-muted]">(optional)</span>
          </span>
          <Input
            value={meetingLabel}
            onChange={(ev) => {
              setMeetingLabel(ev.target.value);
              if (success) setSuccess(false);
            }}
            placeholder="e.g. Weekly stand‑up · 12 May"
            className="border-[--metis-outline-subtle] bg-[var(--metis-control-bg)] text-[--metis-paper] placeholder:text-[--metis-paper-muted]/80"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Paste here</span>
          <Textarea
            value={notes}
            onChange={(ev) => onNotesChange(ev.target.value)}
            placeholder="Paste an email, note, update, call summary, or instruction…"
            className="min-h-[132px] border-[--metis-outline-subtle] bg-[var(--metis-control-bg)] text-[--metis-paper]"
            disabled={isSaving}
          />
        </label>
      </div>

      {captureNotesAiEnabled ? <CaptureNotesExtractPanel issueId={issueId} rawNotes={notes} meetingLabel={meetingLabel} /> : null}

      <footer className="space-y-3 border-t border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-4 py-4 sm:px-5">
        <div className="flex justify-end">
          <Button type="button" className="rounded-full px-5" disabled={!canSubmit} onClick={onSave}>
            {isSaving ? "Saving…" : "Save and structure"}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          issueRoutePrefix ? (
            <InputIntakeSuccess
              message="Added to the issue record for structuring (observation; excluded from briefs until you curate it)."
              href={`${issueRoutePrefix}/input#observations-list`}
              linkLabel="View observations"
            />
          ) : (
            <p className="text-sm text-[--metis-status-success-fg]" role="status">
              Added to the issue record for structuring (not in brief outputs until you adjust it).
            </p>
          )
        ) : null}
      </footer>
    </div>
  );
}
