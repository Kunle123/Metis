"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUnsavedChangesWarning } from "@/lib/hooks/useUnsavedChangesWarning";
import type { GapSeverity } from "@metis/shared/gap";

const severities: GapSeverity[] = ["Critical", "Important", "Watch"];

export function GapCreateForm({ issueId }: { issueId: string }) {
  const router = useRouter();
  const defaultSeverity: GapSeverity = "Important";
  const [title, setTitle] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [stakeholder, setStakeholder] = useState("");
  const [linkedSection, setLinkedSection] = useState("");
  const [severity, setSeverity] = useState<GapSeverity>(defaultSeverity);
  const [prompt, setPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingRequired =
    !title.trim() || !whyItMatters.trim() || !stakeholder.trim() || !prompt.trim();

  const isDirty =
    title.trim().length > 0 ||
    whyItMatters.trim().length > 0 ||
    stakeholder.trim().length > 0 ||
    linkedSection.trim().length > 0 ||
    prompt.trim().length > 0 ||
    severity !== defaultSeverity;

  useUnsavedChangesWarning({ isDirty, isSaving });

  async function onSubmit() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          whyItMatters,
          stakeholder,
          linkedSection: linkedSection.trim() ? linkedSection : null,
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
        <div>
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.18em] text-[--metis-ink-soft]">Register gap</p>
          <p className="mt-1 text-sm text-[--metis-paper-muted]">Creates a persisted clarification gap for this issue.</p>
          <p className="mt-1 text-sm text-[--metis-paper-muted]">All fields below are required to register a gap.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as GapSeverity)}
              className="h-11 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            >
              {severities.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Affects / relates to (optional)</span>
            <Input
              value={linkedSection}
              onChange={(e) => setLinkedSection(e.target.value)}
              className="h-11 rounded-full"
              placeholder="e.g., student comms, legal line, customer impact"
            />
            <p className="text-xs leading-5 text-[--metis-paper-muted]">
              The message, audience, or topic this unresolved question may affect — e.g. student comms, legal line, customer impact, chronology, executive
              recommendation.
            </p>
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Missing (title)</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-full"
            placeholder="Short statement of what is missing"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Impact</span>
          <textarea
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={3}
            className="w-full rounded-[1.1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            placeholder="Why this gap matters for the brief"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Stakeholder role</span>
          <Input
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            className="h-11 rounded-full"
            placeholder="e.g., Legal counsel"
          />
        </label>

        <label className="space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Drafted question</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-[1.1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper] shadow-[inset_0_1px_0_var(--metis-control-inset)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--metis-brass]/60"
            placeholder="The exact clarification question"
          />
        </label>

        <footer className="space-y-3 border-t border-white/10 pt-4">
          {error ? <p className="text-sm text-rose-200" role="alert">{error}</p> : null}
          {missingRequired && !isSaving ? (
            <p className="text-sm leading-6 text-[--metis-paper-muted]">Complete required fields to continue.</p>
          ) : null}
          <div className="flex justify-end">
            <Button
              type="button"
              className="rounded-full px-5"
              disabled={
                isSaving ||
                !title.trim() ||
                !whyItMatters.trim() ||
                !stakeholder.trim() ||
                !prompt.trim()
              }
              onClick={onSubmit}
            >
              {isSaving ? "Saving…" : "Add gap"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
