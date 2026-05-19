"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SourceTier } from "@metis/shared/source";

import { InputIntakeSuccess } from "./input-intake-success";

const tiers: SourceTier[] = ["Official", "Internal", "Major media", "Market signal"];

export function InputSourceIntakeForm({ issueId, issueRoutePrefix }: { issueId: string; issueRoutePrefix: string }) {
  const router = useRouter();
  const [tier, setTier] = useState<SourceTier>("Internal");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaved(false);
    if (!title.trim() || !note.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tier,
          title: title.trim(),
          note: note.trim(),
          snippet: null,
          linkedSection: null,
          reliability: null,
          url: url.trim() ? url.trim() : null,
          timestampLabel: null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      setTitle("");
      setNote("");
      setUrl("");
      setTier("Internal");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create source.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm leading-6 text-[--metis-paper-muted]">
        Add evidence or reference material to the sources register. Add excerpts and links in full on the Sources page.
      </p>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Source type</span>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as SourceTier)}
          className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper]"
        >
          {tiers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Title</span>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (saved) setSaved(false);
          }}
          className="h-10 rounded-full"
          placeholder="Short name for this source"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Why it matters</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-[1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper]"
          placeholder="How this source supports the issue record"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
          URL <span className="font-normal text-[--metis-paper-muted]">(optional)</span>
        </span>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-10 rounded-full" placeholder="https://…" />
      </label>
      {error ? (
        <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <InputIntakeSuccess
          message="Source added to this issue."
          href={`${issueRoutePrefix}/sources`}
          linkLabel="View sources"
        />
      ) : null}
      <div className="flex justify-end border-t border-[--metis-outline-subtle] pt-4">
        <Button type="button" className="rounded-full px-5" disabled={isSaving || !title.trim() || !note.trim()} onClick={onSubmit}>
          {isSaving ? "Saving…" : "Add source"}
        </Button>
      </div>
    </div>
  );
}
