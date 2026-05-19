"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GapSeverity } from "@metis/shared/gap";

import { InputIntakeSuccess } from "./input-intake-success";

const severities: GapSeverity[] = ["Critical", "Important", "Watch"];

export function InputGapIntakeForm({ issueId, issueRoutePrefix }: { issueId: string; issueRoutePrefix: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [severity, setSeverity] = useState<GapSeverity>("Important");
  const [stakeholder, setStakeholder] = useState("");
  const [context, setContext] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaved(false);
    const q = question.trim();
    if (!q) return;
    setIsSaving(true);
    try {
      const owner = stakeholder.trim() || "To be assigned";
      const impact = context.trim() || "Registered from Update record — refine impact on Open questions when ready.";
      const res = await fetch(`/api/issues/${issueId}/gaps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: q,
          prompt: q,
          whyItMatters: impact,
          stakeholder: owner,
          linkedSection: context.trim() ? context.trim() : null,
          severity,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      setQuestion("");
      setStakeholder("");
      setContext("");
      setSeverity("Important");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create open question.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm leading-6 text-[--metis-paper-muted]">
        Register an unresolved question on the tracker. You can refine impact, stakeholders, and resolution on the Open questions page.
      </p>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Open question</span>
        <textarea
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            if (saved) setSaved(false);
          }}
          rows={3}
          className="w-full rounded-[1rem] border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 py-3 text-sm text-[--metis-paper]"
          placeholder="What still needs to be clarified or decided?"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">Severity</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as GapSeverity)}
            className="h-10 w-full rounded-full border border-[var(--metis-control-border)] bg-[var(--metis-control-bg)] px-4 text-sm text-[--metis-paper]"
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
            Owner / stakeholder <span className="font-normal text-[--metis-paper-muted]">(optional)</span>
          </span>
          <Input
            value={stakeholder}
            onChange={(e) => setStakeholder(e.target.value)}
            className="h-10 rounded-full"
            placeholder="e.g. Legal counsel"
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-[0.56rem] font-medium uppercase tracking-[0.16em] text-[--metis-ink-soft]">
          Context <span className="font-normal text-[--metis-paper-muted]">(optional)</span>
        </span>
        <Input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="h-10 rounded-full"
          placeholder="Audience, topic, or brief section affected"
        />
      </label>
      {error ? (
        <p className="text-sm text-[--metis-status-danger-fg]" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <InputIntakeSuccess
          message="Open question added to this issue."
          href={`${issueRoutePrefix}/gaps`}
          linkLabel="View open questions"
        />
      ) : null}
      <div className="flex justify-end border-t border-[--metis-outline-subtle] pt-4">
        <Button type="button" className="rounded-full px-5" disabled={isSaving || !question.trim()} onClick={onSubmit}>
          {isSaving ? "Saving…" : "Add open question"}
        </Button>
      </div>
    </div>
  );
}
