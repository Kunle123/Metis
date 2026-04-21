"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GapSeverity } from "@metis/shared/gap";

const severities: GapSeverity[] = ["Critical", "Important", "Watch"];

export function GapCreateForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [stakeholder, setStakeholder] = useState("");
  const [linkedSection, setLinkedSection] = useState("");
  const [severity, setSeverity] = useState<GapSeverity>("Important");
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          whyItMatters,
          stakeholder,
          linkedSection,
          severity,
          prompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      setTitle("");
      setWhyItMatters("");
      setStakeholder("");
      setLinkedSection("");
      setSeverity("Important");
      setPrompt("");
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
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Register gap</p>
            <p className="mt-1 text-sm text-[--metis-paper-muted]">Creates a persisted clarification gap for this issue.</p>
          </div>
          <Button
            className="rounded-full bg-[--metis-brass] px-5 text-[--metis-dark] hover:bg-[--metis-brass-soft]"
            disabled={
              isSaving ||
              !title.trim() ||
              !whyItMatters.trim() ||
              !stakeholder.trim() ||
              !linkedSection.trim() ||
              !prompt.trim()
            }
            onClick={onSubmit}
          >
            {isSaving ? "Saving…" : "Add gap"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as GapSeverity)}
              className="h-11 w-full rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-[--metis-paper]"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Affected section (free text)</span>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full border-white/10 bg-white/[0.04]"
              placeholder="e.g., Executive Summary"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Missing (title)</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-full border-white/10 bg-white/[0.04]"
            placeholder="Short statement of what is missing"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Impact</span>
          <textarea
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={3}
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[--metis-paper]"
            placeholder="Why this gap matters for the brief"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Stakeholder role</span>
          <Input
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            className="h-11 rounded-full border-white/10 bg-white/[0.04]"
            placeholder="e.g., Legal counsel"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.62rem] uppercase tracking-[0.2em] text-[--metis-ink-soft]">Drafted question</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[--metis-paper]"
            placeholder="The exact clarification question"
          />
        </label>

        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      </div>
    </div>
  );
}
