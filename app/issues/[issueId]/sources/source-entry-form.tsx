"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import type { SourceTier } from "@metis/shared/source";

const tiers: SourceTier[] = ["Official", "Internal", "Major media", "Market signal"];

export function SourceEntryForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const defaultTier: SourceTier = "Internal";
  const [tier, setTier] = useState<SourceTier>(defaultTier);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [snippet, setSnippet] = useState("");
  const [linkedSection, setLinkedSection] = useState("");
  const [reliability, setReliability] = useState("");
  const [url, setUrl] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftKey = useMemo(() => `metis:sources:draft:${issueId}`, [issueId]);

  const isDirty =
    tier !== defaultTier ||
    title.trim().length > 0 ||
    note.trim().length > 0 ||
    snippet.trim().length > 0 ||
    linkedSection.trim().length > 0 ||
    reliability.trim().length > 0 ||
    url.trim().length > 0 ||
    timestampLabel.trim().length > 0;

  useUnsavedChangesWarning({ isDirty, isSaving });

  const missingRequired = !title.trim() || !note.trim();

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        tier: SourceTier;
        title: string;
        note: string;
        snippet: string;
        linkedSection: string;
        reliability: string;
        url: string;
        timestampLabel: string;
      }>;
      if (parsed.tier) setTier(parsed.tier);
      if (typeof parsed.title === "string") setTitle(parsed.title);
      if (typeof parsed.note === "string") setNote(parsed.note);
      if (typeof parsed.snippet === "string") setSnippet(parsed.snippet);
      if (typeof parsed.linkedSection === "string") setLinkedSection(parsed.linkedSection);
      if (typeof parsed.reliability === "string") setReliability(parsed.reliability);
      if (typeof parsed.url === "string") setUrl(parsed.url);
      if (typeof parsed.timestampLabel === "string") setTimestampLabel(parsed.timestampLabel);
    } catch {
      // ignore draft parse failures
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    try {
      window.sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          tier,
          title,
          note,
          snippet,
          linkedSection,
          reliability,
          url,
          timestampLabel,
        }),
      );
    } catch {
      // ignore storage failures
    }
  }, [draftKey, isDirty, isSaving, linkedSection, note, reliability, snippet, tier, timestampLabel, title, url]);

  useEffect(() => {
    if (isSaving) return;
    if (isDirty) return;
    try {
      window.sessionStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }, [draftKey, isDirty, isSaving]);

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const titleTrimmed = title.trim();
      const noteTrimmed = note.trim();

      const res = await fetch(`/api/issues/${issueId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier,
          title: titleTrimmed,
          note: noteTrimmed,
          snippet: snippet.trim() ? snippet : null,
          linkedSection: linkedSection.trim() ? linkedSection : null,
          reliability: reliability.trim() ? reliability : null,
          url: url.trim() ? url : null,
          timestampLabel: timestampLabel.trim() ? timestampLabel : null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      setTitle("");
      setNote("");
      setSnippet("");
      setLinkedSection("");
      setReliability("");
      setUrl("");
      setTimestampLabel("");
      try {
        window.sessionStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-[rgba(255,255,255,0.045)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Add source</p>
          <p className="mt-1 text-sm text-[--metis-paper-muted]">
            Capture a document, update, or piece of evidence used to support the brief and messages.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Source type</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">How this source should be treated when preparing the brief.</p>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as SourceTier)}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Timestamp label (optional)</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">When the information was observed or reported (include time zone).</p>
            <Input
              value={timestampLabel}
              onChange={(e) => setTimestampLabel(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., 07:10 CET (observed) / 09:30 CET (reported)"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Source title</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">A short name for this document, update, or piece of evidence.</p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-full"
            placeholder='e.g., "Consultation overview draft" / "Attendance snapshot (week 2)"'
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Why this matters</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Explain how this source affects the brief, message, or open questions.</p>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 rounded-full"
            placeholder="e.g., Establishes what is confirmed vs still under consultation."
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Relevant excerpt (optional)</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Paste the specific line, paragraph, or detail you may want to rely on later.</p>
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={3}
            className="w-full rounded-[1.1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            placeholder="Paste the most relevant line(s)…"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Related section (optional)</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">Where this is most relevant in the brief (free text).</p>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., Chronology / Confirmed vs unclear / Stakeholder narratives"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Reliability (optional)</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">Your confidence and why (corroboration, directness, recency).</p>
            <Input
              value={reliability}
              onChange={(e) => setReliability(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., High (direct doc) / Medium (single report) / Low (unverified)"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">URL (optional)</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Link to the original artifact when available.</p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-11 rounded-full"
            placeholder="e.g., https://… (article, doc, ticket, dashboard link)"
          />
        </label>

        <footer className="space-y-3 border-t border-white/10 pt-4">
          {error ? (
            <div className="rounded-[1.1rem] border border-rose-400/30 bg-[rgba(118,27,46,0.28)] px-4 py-3 text-sm text-rose-50" role="alert">
              {error}
            </div>
          ) : null}
          {missingRequired && !isSaving ? (
            <p className="text-sm leading-6 text-[--metis-paper-muted]">Complete required fields to continue.</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full px-5"
              disabled={isSaving || !title.trim() || !note.trim()}
              onClick={onSubmit}
            >
              {isSaving ? "Saving…" : "Add source"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

