"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { CaptureNotesExtractPanel } from "./capture-notes-extract-panel";

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
  captureNotesAiEnabled = false,
}: {
  issueId: string;
  /** From server env `NOTES_CAPTURE_AI_ENABLED`; never expose secrets. */
  captureNotesAiEnabled?: boolean;
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
      setError(e instanceof Error ? e.message : "Could not save notes.");
    } finally {
      setIsSaving(false);
    }
  }

  function onNotesChange(v: string) {
    setNotes(v);
    if (success) setSuccess(false);
    if (error) setError(null);
  }

  return (
    <div
      id="capture-notes"
      className="scroll-mt-28 overflow-hidden rounded-[1.25rem] border border-[--metis-info-border] bg-[color-mix(in_oklab,var(--metis-info-bg)_72%,transparent)] shadow-[inset_0_1px_0_color-mix(in_oklab,var(--metis-outline-strong)_22%,transparent)]"
    >
      <div className="border-b border-[--metis-outline-subtle] px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[--metis-ink-soft]">Capture notes</p>
          <p className="text-sm leading-6 text-[--metis-paper-muted]">
            Paste meeting, call, or email notes. Saving creates a saved internal observation for triage (excluded from briefs until you curate it).
          </p>
        </div>

        <p className="mt-3 text-xs leading-5 text-[--metis-paper-muted]">
          Saved rows are stored as observations with attribution; they stay out of generated briefs unless you edit them later to include them.
          {captureNotesAiEnabled ? (
            <>
              {" "}
              Optional structured suggestions can be generated from your notes (review required); nothing is created until you accept a suggestion or
              save notes.
            </>
          ) : (
            <> Important points should be promoted manually into Sources or Open questions.</>
          )}
        </p>
      </div>

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
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Notes</span>
          <Textarea
            value={notes}
            onChange={(ev) => onNotesChange(ev.target.value)}
            placeholder="Paste notes from a meeting, call, email thread, or stakeholder conversation…"
            className="min-h-[132px] border-[--metis-outline-subtle] bg-[var(--metis-control-bg)] text-[--metis-paper]"
            disabled={isSaving}
          />
        </label>
      </div>

      {captureNotesAiEnabled ? <CaptureNotesExtractPanel issueId={issueId} rawNotes={notes} meetingLabel={meetingLabel} /> : null}

      <footer className="space-y-3 border-t border-[--metis-outline-subtle] bg-[color-mix(in_oklab,var(--metis-surface-toolbar)_42%,transparent)] px-4 py-4 sm:px-5">
        <div className="flex justify-end">
          <Button type="button" className="rounded-full px-5" disabled={!canSubmit} onClick={onSave}>
            {isSaving ? "Saving…" : "Save notes"}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-[--metis-status-success-fg]" role="status">
            Notes saved as an observation (not in brief outputs until you adjust it).
          </p>
        ) : null}
      </footer>
    </div>
  );
}
