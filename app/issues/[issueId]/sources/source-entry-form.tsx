"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SourceTier } from "@metis/shared/source";

const tiers: SourceTier[] = ["Official", "Internal", "Major media", "Market signal"];

export function SourceEntryForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [tier, setTier] = useState<SourceTier>("Internal");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [snippet, setSnippet] = useState("");
  const [linkedSection, setLinkedSection] = useState("");
  const [reliability, setReliability] = useState("");
  const [url, setUrl] = useState("");
  const [timestampLabel, setTimestampLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Manual source entry</p>
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
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Tier</span>
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
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Timestamp label</span>
            <Input value={timestampLabel} onChange={(e) => setTimestampLabel(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="e.g., 07:10 CET" />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="Short evidence title" />
        </label>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Note (optional)</span>
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="One-line context" />
        </label>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Snippet (optional)</span>
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            rows={3}
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[--metis-paper]"
            placeholder="Quoted excerpt"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Linked section (optional)</span>
            <Input value={linkedSection} onChange={(e) => setLinkedSection(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="e.g., Chronology" />
          </label>
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Reliability (optional)</span>
            <Input value={reliability} onChange={(e) => setReliability(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="e.g., High confidence internal operational log" />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">URL (optional)</span>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 rounded-full border-white/10 bg-white/[0.04]" placeholder="https://…" />
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

