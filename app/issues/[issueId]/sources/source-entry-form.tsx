"use client";

import { useState } from "react";
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

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier,
          title,
          note: note.trim() ? note : null,
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Manual source entry</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Add evidence to the issue record. This does not send or route anything.</p>
          </div>
          <Button
            className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]"
            disabled={isSaving || !title.trim()}
            onClick={onSubmit}
          >
            {isSaving ? "Saving…" : "Add source"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Tier</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">How direct the source is (official, internal, media, or market signal).</p>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as SourceTier)}
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-[--metis-paper]"
            >
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Timestamp label</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">When the information was observed or reported (include time zone).</p>
            <Input
              value={timestampLabel}
              onChange={(e) => setTimestampLabel(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., 07:10 CET (observed) / 09:30 CET (reported)"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Title</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">A short headline for what we learned.</p>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-full border-white/10 bg-white/[0.04]"
            placeholder='e.g., "Provider confirms regional outage" / "Internal logs show elevated 5xx"'
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Note (optional)</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Why it matters, caveats, or how it should be used in the brief.</p>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-11 rounded-full border-white/10 bg-white/[0.04]"
            placeholder="e.g., Confirms scope is limited to EU; US unaffected."
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Snippet (optional)</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Paste the key quote or excerpt (1–3 lines).</p>
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={3}
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[--metis-paper]"
            placeholder="e.g., “We have identified the root cause and are rolling out a fix…”"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Linked section (optional)</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">Where this should appear in the brief (free text).</p>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., Chronology / Confirmed vs unclear / Executive summary"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Reliability (optional)</span>
            <p className="text-xs leading-5 text-[--metis-paper-muted]">Your confidence + why (corroboration, directness, recency).</p>
            <Input
              value={reliability}
              onChange={(e) => setReliability(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., High (direct log) / Medium (single report) / Low (unverified)"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">URL (optional)</span>
          <p className="text-xs leading-5 text-[--metis-paper-muted]">Link to the original artifact when available.</p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-11 rounded-full border-white/10 bg-white/[0.04]"
            placeholder="e.g., https://… (article, doc, ticket, dashboard link)"
          />
        </label>

        {error ? (
          <div className="rounded-[1.1rem] border border-rose-400/30 bg-[rgba(118,27,46,0.28)] px-4 py-3 text-sm text-rose-50">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

